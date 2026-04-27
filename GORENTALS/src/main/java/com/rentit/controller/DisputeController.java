package com.rentit.controller;

import com.rentit.dto.dispute.*;
import com.rentit.exception.BusinessException;
import com.rentit.model.Dispute;
import com.rentit.service.DisputeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Dispute lifecycle management.
 *
 * BASE URL: /api/disputes
 *
 * Renter/Owner endpoints:
 *   POST   /api/disputes                         Open a dispute
 *   POST   /api/disputes/{id}/evidence           Add evidence files
 *   GET    /api/disputes/{id}                    Get single dispute
 *   GET    /api/disputes/booking/{bookingId}     All disputes for a booking
 *
 * Admin-only endpoints:
 *   GET    /api/disputes/admin/queue             Open + under-review queue
 *   POST   /api/disputes/{id}/review             Start review
 *   POST   /api/disputes/{id}/resolve            Resolve (refund/payout/split/reject)
 *
 * Security:
 *   - Only the renter OR owner of the booking can open or add evidence.
 *   - Resolution is ADMIN-only — no self-service resolution.
 *   - ownerAnnualRunning for TDS is computed externally by admin and passed in
 *     request (avoids exposing raw financial data in the API; admin dashboard
 *     fetches it from the reporting endpoint separately).
 */
@RestController
@RequestMapping("/api/disputes")
@Tag(name = "Disputes", description = "Rental dispute lifecycle management")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    // ── Open dispute ──────────────────────────────────────────────────────────

    @Operation(
        summary     = "Open a dispute",
        description = "Renter or owner raises a dispute for a RETURNED or IN_USE booking. " +
                      "Freezes escrow immediately. Dispute window must not have expired."
    )
    @ApiResponse(responseCode = "201", description = "Dispute created")
    @ApiResponse(responseCode = "409", description = "Active dispute already exists for this booking")
    @ApiResponse(responseCode = "422", description = "Booking ineligible or window expired")
    @PostMapping
    @PreAuthorize("hasAnyRole('RENTER', 'OWNER', 'ADMIN')")
    public ResponseEntity<Dispute> openDispute(
        @Valid @RequestBody OpenDisputeRequest req,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID userId = UUID.fromString(principal.getUsername());

        // Validate role claim in request body
        String role = req.openedByRole().toUpperCase();
        if (!role.equals("RENTER") && !role.equals("OWNER")) {
            throw new BusinessException(
                "openedByRole must be RENTER or OWNER",
                "INVALID_ROLE"
            );
        }

        Dispute dispute = disputeService.openDispute(
            req.bookingId(),
            userId,
            role,
            req.reasonCode(),
            req.description(),
            req.evidenceUrls() != null ? req.evidenceUrls() : List.of()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(dispute);
    }

    // ── Add evidence ──────────────────────────────────────────────────────────

    @Operation(summary = "Add evidence files to an active dispute")
    @ApiResponse(responseCode = "200", description = "Evidence added")
    @ApiResponse(responseCode = "403", description = "Only the dispute opener can add evidence")
    @PostMapping("/{disputeId}/evidence")
    @PreAuthorize("hasAnyRole('RENTER', 'OWNER', 'ADMIN')")
    public ResponseEntity<Dispute> addEvidence(
        @PathVariable UUID disputeId,
        @Valid @RequestBody AddEvidenceRequest req,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID userId  = UUID.fromString(principal.getUsername());
        Dispute updated = disputeService.addEvidence(
            disputeId,
            userId,
            req.evidenceUrls()
        );
        return ResponseEntity.ok(updated);
    }

    // ── Read endpoints ────────────────────────────────────────────────────────

    /**
     * Get a dispute by ID.
     * Accessible to: admin, or the renter/owner of the related booking.
     * Authorization enforced in service layer via booking ownership check.
     */
    @GetMapping("/{disputeId}")
    @PreAuthorize("hasAnyRole('RENTER', 'OWNER', 'ADMIN')")
    public ResponseEntity<Dispute> getDispute(@PathVariable UUID disputeId) {
        return ResponseEntity.ok(disputeService.getDispute(disputeId));
    }

    /**
     * Get all disputes for a specific booking.
     * Accessible to: admin, or the renter/owner of the related booking.
     */
    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('RENTER', 'OWNER', 'ADMIN')")
    public ResponseEntity<List<Dispute>> getDisputesForBooking(
        @PathVariable UUID bookingId
    ) {
        return ResponseEntity.ok(disputeService.getDisputesForBooking(bookingId));
    }

    // ── Admin: queue ──────────────────────────────────────────────────────────

    @Operation(summary = "Admin: view the dispute resolution queue",
               description = "Returns OPEN and UNDER_REVIEW disputes ordered by age (SLA priority).")
    @GetMapping("/admin/queue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Dispute>> getAdminQueue() {
        return ResponseEntity.ok(disputeService.getAdminQueue());
    }

    /**
     * Admin: get disputes that have been OPEN for longer than N hours
     * (SLA breach monitoring).
     */
    @GetMapping("/admin/stale")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Dispute>> getStaleDisputes(
        @RequestParam(defaultValue = "4") long olderThanHours
    ) {
        return ResponseEntity.ok(disputeService.getStaleOpenDisputes(olderThanHours));
    }

    // ── Admin: start review ───────────────────────────────────────────────────

    @Operation(summary = "Admin: start reviewing a dispute",
               description = "Moves dispute from OPEN → UNDER_REVIEW and assigns the admin.")
    @PostMapping("/{disputeId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Dispute> startReview(
        @PathVariable UUID disputeId,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID adminId = UUID.fromString(principal.getUsername());
        return ResponseEntity.ok(disputeService.startReview(disputeId, adminId));
    }

    // ── Admin: resolve ────────────────────────────────────────────────────────

    @Operation(
        summary     = "Admin: resolve a dispute",
        description = """
            Resolves a dispute. The `resolution` field determines the action:
            - `REFUND`  — full refund to renter via Razorpay PG
            - `PAYOUT`  — full payout to owner via RazorpayX
            - `SPLIT`   — custom split between renter and owner
            - `REJECT`  — reject dispute; normal payout resumes
            """
    )
    @ApiResponse(responseCode = "200", description = "Dispute resolved")
    @ApiResponse(responseCode = "400", description = "Missing required fields for chosen resolution")
    @ApiResponse(responseCode = "409", description = "Dispute already resolved")
    @PostMapping("/{disputeId}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Dispute> resolveDispute(
        @PathVariable UUID disputeId,
        @Valid @RequestBody ResolveDisputeRequest req,
        @AuthenticationPrincipal UserDetails principal
    ) {
        UUID adminId  = UUID.fromString(principal.getUsername());
        String res    = req.resolution().toUpperCase();

        Dispute resolved = switch (res) {
            case "REFUND" -> {
                requireField(req.razorpayPaymentId(), "razorpayPaymentId", "REFUND");
                requireField(req.refundAmount(),       "refundAmount",       "REFUND");
                yield disputeService.resolveRefund(
                    disputeId,
                    adminId,
                    req.notes(),
                    req.razorpayPaymentId(),
                    req.refundAmount()
                );
            }

            case "PAYOUT" -> {
                BigDecimal ytd = req.ownerAnnualRunning() != null
                    ? req.ownerAnnualRunning() : BigDecimal.ZERO;
                yield disputeService.resolvePayout(
                    disputeId,
                    adminId,
                    req.notes(),
                    ytd
                );
            }

            case "SPLIT" -> {
                requireField(req.razorpayPaymentId(), "razorpayPaymentId", "SPLIT");
                requireField(req.ownerAmount(),        "ownerAmount",        "SPLIT");
                requireField(req.refundAmount(),       "refundAmount (renterAmount)", "SPLIT");
                BigDecimal ytd = req.ownerAnnualRunning() != null
                    ? req.ownerAnnualRunning() : BigDecimal.ZERO;
                yield disputeService.resolveSplit(
                    disputeId,
                    adminId,
                    req.notes(),
                    req.ownerAmount(),
                    req.refundAmount(),     // renterAmount
                    req.razorpayPaymentId(),
                    ytd
                );
            }

            case "REJECT" -> {
                BigDecimal ytd = req.ownerAnnualRunning() != null
                    ? req.ownerAnnualRunning() : BigDecimal.ZERO;
                yield disputeService.rejectDispute(
                    disputeId,
                    adminId,
                    req.notes(),
                    ytd
                );
            }

            default -> throw new BusinessException(
                "Invalid resolution type: " + req.resolution() +
                ". Must be REFUND | PAYOUT | SPLIT | REJECT",
                "INVALID_RESOLUTION_TYPE"
            );
        };

        return ResponseEntity.ok(resolved);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private void requireField(Object value, String fieldName, String resolution) {
        if (value == null) {
            throw new BusinessException(
                "'" + fieldName + "' is required for resolution type: " + resolution,
                "MISSING_REQUIRED_FIELD"
            );
        }
    }
}
