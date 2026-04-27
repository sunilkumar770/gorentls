package com.rentit.model.enums;

/**
 * Onboarding status of an owner's payout account.
 *
 *   PENDING    — details submitted but penny-drop / KYC not yet verified
 *   VERIFIED   — account validated; eligible for automated settlements
 *   BLOCKED    — flagged for excessive disputes or fraud indicators;
 *                funds remain in escrow until manually reviewed
 *   SUSPENDED  — regulatory or compliance violation; all transfers disabled
 *
 * PayoutEngine checks isVerified() before scheduling any transfer.
 * Only VERIFIED accounts receive payouts.
 */
public enum PayoutOnboardingStatus {
    PENDING,
    VERIFIED,
    BLOCKED,
    SUSPENDED
}
