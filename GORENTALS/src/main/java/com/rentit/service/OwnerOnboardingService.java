package com.rentit.service;

import com.rentit.exception.BusinessException;
import com.rentit.model.OwnerPayoutAccount;
import com.rentit.model.enums.PayoutOnboardingStatus;
import com.rentit.repository.OwnerPayoutAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Manages owner payout account onboarding.
 *
 * FLOW:
 *   submitBankAccount() / submitUpiAccount()
 *     → creates OwnerPayoutAccount (PENDING)
 *     → calls RazorpayX to create Contact + Fund Account
 *   verifyAccount()
 *     → penny-drop succeeded; moves to VERIFIED
 *   blockAccount() / suspendAccount()
 *     → admin-initiated compliance actions
 *   reinstateAccount()
 *     → admin clears a blocked/suspended account
 *
 * RULES:
 *   - One account per owner (UNIQUE constraint enforced at DB and here).
 *   - PayoutEngine ONLY pays to VERIFIED accounts — isVerified() check.
 *   - Account numbers are stored but never displayed in full (maskedIdentifier()).
 *   - RazorpayX Contact + Fund Account created at submission time, not at
 *     payout time — this prevents payout delays.
 */
@Service
public class OwnerOnboardingService {

    private static final Logger log = LoggerFactory.getLogger(OwnerOnboardingService.class);

    private final OwnerPayoutAccountRepository accountRepo;
    private final RazorpayIntegrationService   razorpay;

    public OwnerOnboardingService(
        OwnerPayoutAccountRepository accountRepo,
        RazorpayIntegrationService   razorpay
    ) {
        this.accountRepo = accountRepo;
        this.razorpay    = razorpay;
    }

    // ── Submission ────────────────────────────────────────────────────────────

    /**
     * Owner submits their bank account details for payouts.
     *
     * Creates:
     *   - OwnerPayoutAccount entity (PENDING)
     *   - RazorpayX Contact
     *   - RazorpayX Fund Account (bank)
     *
     * Does NOT verify — verification happens via verifyAccount() after
     * penny-drop webhook or manual confirmation.
     *
     * @param ownerId        platform user ID
     * @param ownerName      full legal name
     * @param ownerEmail     email for RazorpayX contact
     * @param ownerPhone     10-digit phone (no country code)
     * @param accountNumber  bank account number
     * @param ifsc           IFSC code
     */
    @Transactional
    public OwnerPayoutAccount submitBankAccount(
        UUID ownerId,
        String ownerName,
        String ownerEmail,
        String ownerPhone,
        String accountNumber,
        String ifsc
    ) {
        guardNoDuplicateAccount(ownerId);
        validateBankDetails(accountNumber, ifsc);

        // Create RazorpayX contact first
        String contactId = razorpay.createContact(ownerId, ownerName, ownerEmail, ownerPhone);

        // Create RazorpayX fund account
        String fundAccountId = razorpay.createFundAccount(contactId, accountNumber, ifsc, null);

        // Persist with PENDING status — verification comes later
        OwnerPayoutAccount account = OwnerPayoutAccount.bank(ownerId, accountNumber, ifsc);
        account.registerFundAccount(fundAccountId);   // stores FA ID, stays PENDING
        accountRepo.save(account);

        log.info("Bank account submitted: ownerId={} faId={} status=PENDING",
            ownerId, fundAccountId);

        return account;
    }

    /**
     * Owner submits their UPI VPA for payouts.
     *
     * UPI accounts are auto-verified by RazorpayX during fund account creation
     * via VPA validation — so we call verifyAccount() immediately after.
     *
     * @param ownerId    platform user ID
     * @param ownerName  full legal name
     * @param ownerEmail email for RazorpayX contact
     * @param ownerPhone 10-digit phone
     * @param upiId      UPI Virtual Payment Address e.g. owner@upi
     */
    @Transactional
    public OwnerPayoutAccount submitUpiAccount(
        UUID ownerId,
        String ownerName,
        String ownerEmail,
        String ownerPhone,
        String upiId
    ) {
        guardNoDuplicateAccount(ownerId);
        validateUpiId(upiId);

        String contactId     = razorpay.createContact(ownerId, ownerName, ownerEmail, ownerPhone);
        String fundAccountId = razorpay.createFundAccount(contactId, null, null, upiId);

        OwnerPayoutAccount account = OwnerPayoutAccount.upi(ownerId, upiId);
        // UPI VPA validated by Razorpay at fund account creation — mark VERIFIED immediately
        account.verify(fundAccountId, "RAZORPAY_VPA_VALIDATED");
        accountRepo.save(account);

        log.info("UPI account submitted and verified: ownerId={} upiId={} faId={}",
            ownerId, upiId, fundAccountId);
        return account;
    }

    // ── Verification ──────────────────────────────────────────────────────────

    /**
     * Mark an owner's bank account as verified after penny-drop succeeds.
     *
     * Called by:
     *   a) Razorpay penny-drop webhook handler (when implemented)
     *   b) Admin manually confirming penny-drop in the admin panel
     *
     * @param ownerId          platform user ID
     * @param fundAccountId    RazorpayX FA ID (fa_xxxxx) — from penny-drop event
     * @param verificationRef  penny-drop transaction reference
     */
    @Transactional
    public OwnerPayoutAccount verifyAccount(
        UUID ownerId,
        String fundAccountId,
        String verificationRef
    ) {
        OwnerPayoutAccount account = fetchAccount(ownerId);

        if (account.getStatus() == PayoutOnboardingStatus.VERIFIED) {
            log.info("Account already VERIFIED for ownerId={} — no-op", ownerId);
            return account;
        }

        if (account.getStatus() == PayoutOnboardingStatus.SUSPENDED) {
            throw BusinessException.unprocessable(
                "Cannot verify a SUSPENDED account. Lift suspension first.",
                "ACCOUNT_SUSPENDED"
            );
        }

        account.verify(fundAccountId, verificationRef);
        accountRepo.save(account);

        log.info("Payout account VERIFIED: ownerId={} faId={} ref={}",
            ownerId, fundAccountId, verificationRef);
        return account;
    }

    // ── Admin actions ─────────────────────────────────────────────────────────

    /**
     * Admin blocks an owner's payout account.
     * Use for: excessive dispute rate, fraud signals, chargebacks.
     * Pending payouts are put ON_HOLD until account is reinstated.
     */
    @Transactional
    public OwnerPayoutAccount blockAccount(UUID ownerId, String adminReason) {
        OwnerPayoutAccount account = fetchAccount(ownerId);
        account.block();
        accountRepo.save(account);
        log.warn("Payout account BLOCKED: ownerId={} reason='{}'", ownerId, adminReason);
        return account;
    }

    /**
     * Admin suspends an owner's payout account.
     * Use for: regulatory non-compliance, court order, AML flag.
     * Stronger than BLOCKED — requires compliance team sign-off to lift.
     */
    @Transactional
    public OwnerPayoutAccount suspendAccount(UUID ownerId, String adminReason) {
        OwnerPayoutAccount account = fetchAccount(ownerId);
        account.suspend();
        accountRepo.save(account);
        log.warn("Payout account SUSPENDED: ownerId={} reason='{}'", ownerId, adminReason);
        return account;
    }

    /**
     * Admin reinstates a BLOCKED or SUSPENDED account after review.
     * Requires a fresh verification reference (re-penny-drop recommended).
     */
    @Transactional
    public OwnerPayoutAccount reinstateAccount(
        UUID ownerId,
        String freshVerificationRef,
        String adminNotes
    ) {
        OwnerPayoutAccount account = fetchAccount(ownerId);

        if (account.getStatus() == PayoutOnboardingStatus.PENDING) {
            throw BusinessException.unprocessable(
                "Account is PENDING — use verifyAccount() instead of reinstate",
                "ACCOUNT_NOT_BLOCKED"
            );
        }

        if (account.getStatus() == PayoutOnboardingStatus.VERIFIED) {
            log.info("Account already VERIFIED for ownerId={} — reinstate is no-op", ownerId);
            return account;
        }

        account.reinstate(freshVerificationRef);
        accountRepo.save(account);

        log.info("Payout account REINSTATED: ownerId={} ref='{}' notes='{}'",
            ownerId, freshVerificationRef, adminNotes);
        return account;
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OwnerPayoutAccount getAccount(UUID ownerId) {
        return fetchAccount(ownerId);
    }

    @Transactional(readOnly = true)
    public boolean hasVerifiedAccount(UUID ownerId) {
        return accountRepo
            .findByOwnerIdAndStatus(ownerId, PayoutOnboardingStatus.VERIFIED)
            .map(OwnerPayoutAccount::isVerified)
            .orElse(false);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private OwnerPayoutAccount fetchAccount(UUID ownerId) {
        return accountRepo.findByOwnerId(ownerId)
            .orElseThrow(() -> BusinessException.notFound("OwnerPayoutAccount", ownerId));
    }

    private void guardNoDuplicateAccount(UUID ownerId) {
        if (accountRepo.existsByOwnerId(ownerId)) {
            throw BusinessException.conflict(
                "Payout account already exists for owner: " + ownerId +
                ". Use update flow to change account details.",
                "PAYOUT_ACCOUNT_ALREADY_EXISTS"
            );
        }
    }

    private void validateBankDetails(String accountNumber, String ifsc) {
        if (accountNumber == null || accountNumber.isBlank())
            throw new BusinessException("Account number is required", "MISSING_ACCOUNT_NUMBER");

        if (ifsc == null || !ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$"))
            throw new BusinessException(
                "Invalid IFSC code: " + ifsc + ". Format: 4 letters + 0 + 6 alphanumeric",
                "INVALID_IFSC"
            );

        if (accountNumber.length() < 9 || accountNumber.length() > 18)
            throw new BusinessException(
                "Account number must be 9–18 digits",
                "INVALID_ACCOUNT_NUMBER_LENGTH"
            );

        if (!accountNumber.matches("^[0-9]+$"))
            throw new BusinessException(
                "Account number must contain only digits",
                "INVALID_ACCOUNT_NUMBER_FORMAT"
            );
    }

    private void validateUpiId(String upiId) {
        if (upiId == null || upiId.isBlank())
            throw new BusinessException("UPI ID is required", "MISSING_UPI_ID");

        // UPI VPA format: localpart@provider (localpart: alphanumeric + . - _)
        if (!upiId.matches("^[a-zA-Z0-9._\\-]{2,256}@[a-zA-Z]{2,64}$"))
            throw new BusinessException(
                "Invalid UPI ID format: " + upiId + ". Expected: yourname@bank",
                "INVALID_UPI_ID"
            );
    }
}
