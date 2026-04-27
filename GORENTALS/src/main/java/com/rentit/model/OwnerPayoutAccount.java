package com.rentit.model;

import com.rentit.model.enums.PayoutOnboardingStatus;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;
import java.util.UUID;

/**
 * Verified bank account or UPI ID for an owner to receive payouts.
 *
 * One account per owner (UNIQUE constraint on owner_id).
 * Owner submits details → penny drop verifies → fundAccountId created in
 * RazorpayX → status moves to VERIFIED → eligible for automated settlements.
 *
 * The platform NEVER pays out to an unverified account.
 * PayoutEngine checks isVerified() before scheduling any transfer.
 */
@Entity
@Table(
    name = "owner_payout_accounts",
    indexes = {
        @Index(name = "idx_payout_account_owner", columnList = "owner_id", unique = true)
    }
)
public class OwnerPayoutAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** One-to-one with users table (owner_id). Not a FK to avoid cascade issues. */
    @Column(name = "owner_id", nullable = false, unique = true, updatable = false)
    private UUID ownerId;

    /**
     * "BANK" → uses accountNumber + ifsc.
     * "UPI"  → uses upiId (VPA).
     */
    @Column(name = "account_type", nullable = false, length = 8)
    private String accountType;

    /** For BANK type. Stored for audit; never displayed in full on frontend. */
    @Column(name = "account_number", length = 64)
    private String accountNumber;

    /** For BANK type. e.g. "HDFC0001234" */
    @Column(length = 16)
    private String ifsc;

    /** For UPI type. e.g. "owner@upi" */
    @Column(name = "upi_id", length = 128)
    private String upiId;

    /**
     * RazorpayX Fund Account ID (fa_xxxxx).
     * Created via POST /v1/fund_accounts after penny-drop verification.
     * This ID is what PayoutEngine passes to the RazorpayX Payouts API.
     */
    @JsonIgnore
    @Column(name = "fund_account_id", length = 64)
    private String fundAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PayoutOnboardingStatus status = PayoutOnboardingStatus.PENDING;

    /**
     * Penny-drop transaction reference from Razorpay or bank.
     * Stored for compliance audit trail.
     */
    @Column(name = "verification_ref", length = 128)
    private String verificationRef;

    /** Timestamp when penny-drop or KYC succeeded. */
    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }

    // ── Constructors ─────────────────────────────────────────────────────────

    protected OwnerPayoutAccount() {}

    /** For BANK account type. */
    public static OwnerPayoutAccount bank(
        UUID ownerId, String accountNumber, String ifsc
    ) {
        OwnerPayoutAccount a = new OwnerPayoutAccount();
        a.ownerId       = ownerId;
        a.accountType   = "BANK";
        a.accountNumber = accountNumber;
        a.ifsc          = ifsc;
        return a;
    }

    /** For UPI / VPA type. */
    public static OwnerPayoutAccount upi(UUID ownerId, String upiId) {
        OwnerPayoutAccount a = new OwnerPayoutAccount();
        a.ownerId     = ownerId;
        a.accountType = "UPI";
        a.upiId       = upiId;
        return a;
    }

    // ── State transitions ─────────────────────────────────────────────────────

    /**
     * Store the RazorpayX fund account ID created at submission time,
     * before penny-drop verification completes.
     * Status stays PENDING.
     */
    public void registerFundAccount(String fundAccountId) {
        this.fundAccountId = fundAccountId;
        this.updatedAt     = Instant.now();
    }

    /**
     * Called after penny-drop succeeds and RazorpayX fund account is created.
     *
     * @param fundAccountId  RazorpayX FA ID (fa_xxxxx)
     * @param verificationRef penny-drop transaction reference
     */
    public void verify(String fundAccountId, String verificationRef) {
        this.fundAccountId   = fundAccountId;
        this.verificationRef = verificationRef;
        this.status          = PayoutOnboardingStatus.VERIFIED;
        this.verifiedAt      = Instant.now();
        this.updatedAt       = Instant.now();
    }

    /**
     * Admin block — triggered by fraud signals or excessive dispute rate.
     * Funds for pending payouts are held until manual review clears the account.
     */
    public void block() {
        this.status    = PayoutOnboardingStatus.BLOCKED;
        this.updatedAt = Instant.now();
    }

    /**
     * Regulatory / compliance suspension.
     * Disables all future payouts until compliance team lifts the suspension.
     */
    public void suspend() {
        this.status    = PayoutOnboardingStatus.SUSPENDED;
        this.updatedAt = Instant.now();
    }

    /**
     * Reinstate a blocked/suspended account after manual review.
     * Requires a fresh verification ref.
     */
    public void reinstate(String freshVerificationRef) {
        this.verificationRef = freshVerificationRef;
        this.status          = PayoutOnboardingStatus.VERIFIED;
        this.updatedAt       = Instant.now();
    }

    // ── Convenience ───────────────────────────────────────────────────────────

    /**
     * PayoutEngine checks this before scheduling any transfer.
     * Returns true ONLY for VERIFIED accounts.
     */
    public boolean isVerified() {
        return status == PayoutOnboardingStatus.VERIFIED && fundAccountId != null;
    }

    /**
     * Masked display for frontend — shows last 4 digits of account or
     * first 5 chars of UPI ID. Never expose full account details.
     */
    public String maskedIdentifier() {
        if ("UPI".equals(accountType) && upiId != null) {
            return upiId.length() > 5 ? upiId.substring(0, 5) + "***" : upiId;
        }
        if (accountNumber != null && accountNumber.length() > 4) {
            return "****" + accountNumber.substring(accountNumber.length() - 4);
        }
        return "****";
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public UUID getId()                          { return id; }
    public UUID getOwnerId()                     { return ownerId; }
    public String getAccountType()               { return accountType; }
    public String getAccountNumber()             { return accountNumber; }
    public String getIfsc()                      { return ifsc; }
    public String getUpiId()                     { return upiId; }
    public String getFundAccountId()             { return fundAccountId; }
    public PayoutOnboardingStatus getStatus()    { return status; }
    public String getVerificationRef()           { return verificationRef; }
    public Instant getVerifiedAt()               { return verifiedAt; }
    public Instant getCreatedAt()                { return createdAt; }
    public Instant getUpdatedAt()                { return updatedAt; }

    @Override
    public String toString() {
        return String.format(
            "OwnerPayoutAccount{id=%s, owner=%s, type=%s, status=%s, masked=%s}",
            id, ownerId, accountType, status, maskedIdentifier()
        );
    }
}
