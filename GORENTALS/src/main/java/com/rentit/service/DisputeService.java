package com.rentit.service;

import com.rentit.exception.BusinessException;
import com.rentit.model.Booking;
import com.rentit.model.Dispute;
import com.rentit.model.enums.BookingStatus;
import com.rentit.model.enums.DisputeStatus;
import com.rentit.repository.BookingRepository;
import com.rentit.repository.DisputeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Manages the full lifecycle of a rental dispute.
 *
 * FLOW:
 *   openDispute()        — renter/owner raises dispute during post-return window
 *   startReview()        — admin picks up the dispute
 *   resolveRefund()      — admin rules in renter's favour → full refund
 *   resolvePayout()      — admin rules in owner's favour → full payout
 *   resolveSplit()       — admin orders partial split
 *   rejectDispute()      — admin rejects frivolous dispute → normal payout resumes
 *
 * CONSTRAINTS (enforced here):
 *   - Only eligible bookings (RETURNED or IN_USE) can have disputes opened.
 *   - Only one active dispute per booking at a time.
 *   - Dispute must be opened within the dispute window (24h after return).
 *   - Resolution amounts must not exceed total escrow held.
 *   - All escrow state changes delegated to BookingEscrowService.
 *   - All refund PG calls delegated to RazorpayIntegrationService.
 */
@Service
public class DisputeService {

    private static final Logger log = LoggerFactory.getLogger(DisputeService.class);

    private final DisputeRepository          disputeRepo;
    private final BookingRepository          bookingRepo;
    private final BookingEscrowService       escrowService;
    private final RazorpayIntegrationService razorpay;

    public DisputeService(
        DisputeRepository          disputeRepo,
        BookingRepository          bookingRepo,
        BookingEscrowService       escrowService,
        RazorpayIntegrationService razorpay
    ) {
        this.disputeRepo   = disputeRepo;
        this.bookingRepo   = bookingRepo;
        this.escrowService = escrowService;
        this.razorpay      = razorpay;
    }

    // ── Open dispute ──────────────────────────────────────────────────────────

    /**
     * Open a new dispute for a booking.
     *
     * Eligibility checks (in order):
     *   1. Booking must be RETURNED or IN_USE
     *   2. No active dispute already exists for this booking
     *   3. Dispute window has not expired (only for RETURNED bookings)
     *
     * Side effects:
     *   - BookingEscrowService.holdForDispute() freezes the escrow (ON_HOLD)
     *   - Dispute entity created and persisted
     *
     * @param bookingId     booking being disputed
     * @param openedBy      user ID of the person raising the dispute
     * @param openedByRole  "RENTER" or "OWNER"
     * @param reasonCode    one of: NOT_DELIVERED, DAMAGED_ITEM, LATE_RETURN,
     *                      WRONG_ITEM, OTHER
     * @param description   free-text description (min 20 chars enforced here)
     * @param evidenceUrls  list of S3/GCS URLs uploaded before calling this
     * @return created Dispute
     */
    @Transactional
    public Dispute openDispute(
        UUID bookingId,
        UUID openedBy,
        String openedByRole,
        String reasonCode,
        String description,
        List<String> evidenceUrls
    ) {
        // ── Fetch booking ──────────────────────────────────────────────────────
        Booking booking = bookingRepo.findById(bookingId)
            .orElseThrow(() -> BusinessException.notFound("Booking", bookingId));

        // ── Eligibility: booking status ────────────────────────────────────────
        if (booking.getBookingStatus() != BookingStatus.RETURNED
            && booking.getBookingStatus() != BookingStatus.IN_USE) {
            throw BusinessException.unprocessable(
                "Disputes can only be opened for IN_USE or RETURNED bookings. " +
                "Current status: " + booking.getBookingStatus(),
                "DISPUTE_INELIGIBLE_STATUS"
            );
        }

        // ── Eligibility: no active dispute already ─────────────────────────────
        if (disputeRepo.existsActiveForBooking(bookingId)) {
            throw BusinessException.conflict(
                "An active dispute already exists for booking: " + bookingId,
                "DISPUTE_ALREADY_ACTIVE"
            );
        }

        // ── Eligibility: dispute window not expired (only for RETURNED) ────────
        if (booking.getBookingStatus() == BookingStatus.RETURNED) {
            Instant windowEnd = booking.getDisputeWindowEndsAt();
            if (windowEnd != null && Instant.now().isAfter(windowEnd)) {
                throw BusinessException.unprocessable(
                    "Dispute window expired at " + windowEnd + " for booking: " + bookingId,
                    "DISPUTE_WINDOW_EXPIRED"
                );
            }
        }

        // ── Validate inputs ────────────────────────────────────────────────────
        if (description == null || description.trim().length() < 20) {
            throw new BusinessException(
                "Dispute description must be at least 20 characters",
                "DISPUTE_DESCRIPTION_TOO_SHORT"
            );
        }

        validateReasonCode(reasonCode);

        // ── Freeze escrow ──────────────────────────────────────────────────────
        escrowService.holdForDispute(booking);

        // ── Create dispute ────────────────────────────────────────────────────
        Dispute dispute = new Dispute(
            bookingId,
            openedBy,
            openedByRole.toUpperCase(),
            reasonCode.toUpperCase(),
            description.trim(),
            evidenceUrls
        );
        disputeRepo.save(dispute);

        log.info("Dispute opened: disputeId={} bookingId={} openedBy={} role={} reason={}",
            dispute.getId(), bookingId, openedBy, openedByRole, reasonCode);

        return dispute;
    }

    // ── Admin: start review ───────────────────────────────────────────────────

    /**
     * Admin assigns themselves to a dispute and moves it to UNDER_REVIEW.
     * SLA target: every OPEN dispute should reach UNDER_REVIEW within 4 hours.
     */
    @Transactional
    public Dispute startReview(UUID disputeId, UUID adminId) {
        Dispute dispute = fetchDispute(disputeId);

        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw BusinessException.conflict(
                "Only OPEN disputes can be moved to UNDER_REVIEW. Status: " + dispute.getStatus(),
                "DISPUTE_NOT_OPEN"
            );
        }

        dispute.startReview();
        disputeRepo.save(dispute);

        log.info("Dispute review started: disputeId={} adminId={}", disputeId, adminId);
        return dispute;
    }

    // ── Admin: resolutions ────────────────────────────────────────────────────

    /**
     * Full refund to renter — admin rules entirely in renter's favour.
     *
     * Flow:
     *   1. Mark dispute RESOLVED_REFUND
     *   2. Fetch original Razorpay payment ID for the advance (or final)
     *   3. Issue Razorpay refund for full escrow amount
     *   4. BookingEscrowService.processFullRefund() posts ledger + cancels booking
     *
     * @param disputeId       dispute to resolve
     * @param adminId         admin user resolving
     * @param notes           mandatory resolution explanation
     * @param razorpayPaymentId  original Razorpay payment ID to refund against
     * @param refundAmountINR total amount to refund (advance + final + deposit)
     */
    @Transactional
    public Dispute resolveRefund(
        UUID disputeId,
        UUID adminId,
        String notes,
        String razorpayPaymentId,
        BigDecimal refundAmountINR
    ) {
        Dispute dispute  = fetchActiveDispute(disputeId);
        Booking booking  = fetchBooking(dispute.getBookingId());

        if (refundAmountINR == null || refundAmountINR.compareTo(BigDecimal.ZERO) <= 0)
            throw new BusinessException("Refund amount must be positive", "INVALID_REFUND_AMOUNT");

        // Issue Razorpay refund — this calls the PG
        String rpRefundId = razorpay.createRefund(
            razorpayPaymentId,
            refundAmountINR,
            "dispute_resolution",
            booking.getId()
        );

        // Post ledger + cancel booking
        escrowService.processFullRefund(booking, refundAmountINR, notes, rpRefundId);

        // Resolve the dispute record
        dispute.resolve(
            DisputeStatus.RESOLVED_REFUND,
            BigDecimal.ZERO,
            refundAmountINR,
            adminId,
            notes
        );
        disputeRepo.save(dispute);

        log.info("Dispute RESOLVED_REFUND: disputeId={} bookingId={} refund=₹{} admin={}",
            disputeId, booking.getId(), refundAmountINR, adminId);
        return dispute;
    }

    /**
     * Full payout to owner — admin rules entirely in owner's favour.
     * Clears the ON_HOLD and routes booking through the normal payout path.
     *
     * @param ownerAnnualRunning  owner's YTD payouts for TDS threshold
     */
    @Transactional
    public Dispute resolvePayout(
        UUID disputeId,
        UUID adminId,
        String notes,
        BigDecimal ownerAnnualRunning
    ) {
        Dispute dispute = fetchActiveDispute(disputeId);
        Booking booking = fetchBooking(dispute.getBookingId());

        // Unfreeze escrow and trigger normal payout
        escrowService.resolveDisputeRejected(booking, ownerAnnualRunning);

        // Resolve dispute record
        BigDecimal ownerAmt = booking.getAdvanceAmount()
            .add(booking.getRemainingAmount())
            .setScale(2, RoundingMode.HALF_UP);

        dispute.resolve(
            DisputeStatus.RESOLVED_PAYOUT,
            ownerAmt,
            BigDecimal.ZERO,
            adminId,
            notes
        );
        disputeRepo.save(dispute);

        log.info("Dispute RESOLVED_PAYOUT: disputeId={} bookingId={} ownerAmt=₹{} admin={}",
            disputeId, booking.getId(), ownerAmt, adminId);
        return dispute;
    }

    /**
     * Split resolution — admin decides a custom split between owner and renter.
     *
     * @param ownerAmount   amount released to owner (may be 0)
     * @param renterAmount  amount refunded to renter (may be 0)
     * @param razorpayPaymentId  original payment ID for renter's refund portion
     * @param rpRefundId    refund ID from Razorpay (caller must pre-issue if renterAmount > 0)
     * @param ownerAnnualRunning  owner YTD for TDS
     */
    @Transactional
    public Dispute resolveSplit(
        UUID disputeId,
        UUID adminId,
        String notes,
        BigDecimal ownerAmount,
        BigDecimal renterAmount,
        String razorpayPaymentId,
        BigDecimal ownerAnnualRunning
    ) {
        Dispute dispute = fetchActiveDispute(disputeId);
        Booking booking = fetchBooking(dispute.getBookingId());

        if (ownerAmount == null) ownerAmount  = BigDecimal.ZERO;
        if (renterAmount == null) renterAmount = BigDecimal.ZERO;

        if (ownerAmount.compareTo(BigDecimal.ZERO) < 0
            || renterAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Split amounts cannot be negative", "INVALID_SPLIT_AMOUNT");
        }

        if (ownerAmount.compareTo(BigDecimal.ZERO) == 0
            && renterAmount.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException(
                "At least one of owner amount or renter amount must be > 0",
                "SPLIT_BOTH_ZERO"
            );
        }

        // Issue Razorpay refund for renter's portion first (before ledger)
        String rpRefundId = null;
        if (renterAmount.compareTo(BigDecimal.ZERO) > 0) {
            rpRefundId = razorpay.createRefund(
                razorpayPaymentId,
                renterAmount,
                "dispute_split",
                booking.getId()
            );
        }

        // Post split to ledger and mark booking COMPLETED
        escrowService.processSplitResolution(
            booking, ownerAmount, renterAmount,
            rpRefundId, ownerAnnualRunning
        );

        dispute.resolve(
            DisputeStatus.RESOLVED_SPLIT,
            ownerAmount,
            renterAmount,
            adminId,
            notes
        );
        disputeRepo.save(dispute);

        log.info("Dispute RESOLVED_SPLIT: disputeId={} owner=₹{} renter=₹{} admin={}",
            disputeId, ownerAmount, renterAmount, adminId);
        return dispute;
    }

    /**
     * Reject a frivolous or unsubstantiated dispute.
     * Normal payout proceeds as if no dispute was raised.
     *
     * @param ownerAnnualRunning  owner YTD for TDS
     */
    @Transactional
    public Dispute rejectDispute(
        UUID disputeId,
        UUID adminId,
        String notes,
        BigDecimal ownerAnnualRunning
    ) {
        Dispute dispute = fetchActiveDispute(disputeId);
        Booking booking = fetchBooking(dispute.getBookingId());

        // Unfreeze and trigger payout
        escrowService.resolveDisputeRejected(booking, ownerAnnualRunning);

        dispute.resolve(
            DisputeStatus.REJECTED,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            adminId,
            notes
        );
        disputeRepo.save(dispute);

        log.info("Dispute REJECTED: disputeId={} bookingId={} admin={}",
            disputeId, booking.getId(), adminId);
        return dispute;
    }

    // ── Add evidence ──────────────────────────────────────────────────────────

    /**
     * Add additional evidence URLs to an active dispute.
     * Allowed during OPEN or UNDER_REVIEW status only.
     */
    @Transactional
    public Dispute addEvidence(UUID disputeId, UUID requestingUserId, List<String> newUrls) {
        Dispute dispute = fetchDispute(disputeId);

        if (!dispute.isActive()) {
            throw BusinessException.unprocessable(
                "Cannot add evidence to a resolved dispute: " + dispute.getStatus(),
                "DISPUTE_ALREADY_RESOLVED"
            );
        }

        if (!dispute.getOpenedBy().equals(requestingUserId)) {
            throw BusinessException.forbidden(
                "Only the user who opened the dispute can add evidence"
            );
        }

        newUrls.forEach(dispute::addEvidence);
        disputeRepo.save(dispute);

        log.info("Evidence added: disputeId={} urls={} by={}",
            disputeId, newUrls.size(), requestingUserId);
        return dispute;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Dispute getDispute(UUID disputeId) {
        return fetchDispute(disputeId);
    }

    @Transactional(readOnly = true)
    public List<Dispute> getAdminQueue() {
        return disputeRepo.findAdminQueue();
    }

    @Transactional(readOnly = true)
    public List<Dispute> getStaleOpenDisputes(long olderThanHours) {
        Instant threshold = Instant.now().minusSeconds(olderThanHours * 3600);
        return disputeRepo.findStaleOpenDisputes(threshold);
    }

    @Transactional(readOnly = true)
    public List<Dispute> getDisputesForBooking(UUID bookingId) {
        return disputeRepo.findByBookingIdOrderByCreatedAtDesc(bookingId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Dispute fetchDispute(UUID id) {
        return disputeRepo.findById(id)
            .orElseThrow(() -> BusinessException.notFound("Dispute", id));
    }

    private Dispute fetchActiveDispute(UUID id) {
        Dispute d = fetchDispute(id);
        if (!d.isActive()) {
            throw BusinessException.conflict(
                "Dispute " + id + " is already resolved: " + d.getStatus(),
                "DISPUTE_ALREADY_RESOLVED"
            );
        }
        return d;
    }

    private Booking fetchBooking(UUID id) {
        return bookingRepo.findById(id)
            .orElseThrow(() -> BusinessException.notFound("Booking", id));
    }

    private void validateReasonCode(String reasonCode) {
        List<String> valid = List.of(
            "NOT_DELIVERED", "DAMAGED_ITEM", "LATE_RETURN", "WRONG_ITEM", "OTHER"
        );
        if (reasonCode == null || !valid.contains(reasonCode.toUpperCase())) {
            throw new BusinessException(
                "Invalid reason code '" + reasonCode + "'. Must be one of: " + valid,
                "INVALID_REASON_CODE"
            );
        }
    }
}
