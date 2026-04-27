package com.rentit.model.enums;

/**
 * Lifecycle of an outgoing payout to an owner.
 *
 *   PENDING   → created by PayoutEngine, not yet sent to RazorpayX
 *   INITIATED → RazorpayX API call succeeded, transfer in-flight
 *   SUCCESS   → RazorpayX webhook confirmed payout.processed
 *   FAILED    → RazorpayX returned error or webhook payout.failed received
 *   ON_HOLD   → admin manually froze the payout (fraud risk, compliance flag)
 */
public enum PayoutStatus {
    PENDING,
    INITIATED,
    SUCCESS,
    FAILED,
    ON_HOLD
}
