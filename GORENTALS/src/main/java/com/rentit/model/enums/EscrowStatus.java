package com.rentit.model.enums;

/**
 * Tracks where the renter's money is at any point in time.
 *
 * Money flow:
 *
 *   NONE
 *    │
 *    ▼
 *   ADVANCE_HELD     ← renter's advance captured into escrow
 *    │
 *    ▼
 *   FULL_HELD        ← remaining + deposit also captured
 *    │
 *    ├──► ON_HOLD         ← dispute raised; funds frozen
 *    │       │
 *    │       └──► PARTIAL_RELEASED  ← dispute resolved with split
 *    │
 *    ├──► READY_FOR_PAYOUT  ← dispute window expired, clean
 *    │       │
 *    │       └──► PAID_OUT  ← RazorpayX payout initiated to owner
 *    │
 *    └──► REFUNDED    ← cancellation or full refund to renter
 */
public enum EscrowStatus {

    NONE,              // no money captured yet
    ADVANCE_HELD,      // advance payment in escrow
    FULL_HELD,         // full rental + deposit in escrow
    PARTIAL_RELEASED,  // split resolution: part paid out, part refunded
    REFUNDED,          // full or partial refund sent back to renter
    ON_HOLD,           // dispute open — funds frozen, no payout until resolved
    READY_FOR_PAYOUT,  // all conditions met, payout engine will pick up
    PAID_OUT           // RazorpayX transfer initiated to owner
}
