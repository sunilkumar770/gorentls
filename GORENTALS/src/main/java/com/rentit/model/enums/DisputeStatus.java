package com.rentit.model.enums;

/**
 * Lifecycle of a dispute raised during the post-return window.
 *
 *   OPEN             — just raised; escrow moves to ON_HOLD automatically
 *   UNDER_REVIEW     — admin has picked it up and is reviewing evidence
 *   RESOLVED_REFUND  — full refund to renter; escrow → REFUNDED
 *   RESOLVED_PAYOUT  — full payout to owner; escrow → READY_FOR_PAYOUT
 *   RESOLVED_SPLIT   — split decision; escrow → PARTIAL_RELEASED
 *   REJECTED         — no valid grounds; payout proceeds normally
 */
public enum DisputeStatus {
    OPEN,
    UNDER_REVIEW,
    RESOLVED_REFUND,
    RESOLVED_PAYOUT,
    RESOLVED_SPLIT,
    REJECTED
}
