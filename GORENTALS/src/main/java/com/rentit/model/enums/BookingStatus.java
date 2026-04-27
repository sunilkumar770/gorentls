package com.rentit.model.enums;

/**
 * Lifecycle states of a rental booking.
 *
 * Legal transitions are enforced by canTransitionTo().
 * BookingEscrowService calls this guard before every state change.
 *
 * State diagram:
 *
 *   PENDING_PAYMENT ──► CONFIRMED ──► IN_USE ──► RETURNED ──► COMPLETED
 *          │               │             │            │
 *          └──► CANCELLED  └──► NO_SHOW  └──► DISPUTED ◄──────┘
 *                                               │
 *                                    COMPLETED / CANCELLED
 */
public enum BookingStatus {

    PENDING_PAYMENT,   // created, no payment yet
    CONFIRMED,         // advance captured, item not yet handed over
    IN_USE,            // full payment captured, item with renter
    RETURNED,          // owner marked item returned, dispute window open
    COMPLETED,         // dispute window passed, payout triggered
    CANCELLED,         // cancelled by renter or owner
    NO_SHOW,           // renter did not appear at handover
    DISPUTED;          // active dispute — escrow frozen

    /**
     * Returns true if transitioning FROM this state TO {@code next} is allowed.
     * Throw InvalidStateTransitionException when this returns false.
     */
    public boolean canTransitionTo(BookingStatus next) {
        return switch (this) {
            case PENDING_PAYMENT -> next == CONFIRMED  || next == CANCELLED;
            case CONFIRMED       -> next == IN_USE     || next == CANCELLED || next == NO_SHOW;
            case IN_USE          -> next == RETURNED   || next == DISPUTED;
            case RETURNED        -> next == COMPLETED  || next == DISPUTED;
            case DISPUTED        -> next == COMPLETED  || next == CANCELLED;
            default              -> false; // COMPLETED, CANCELLED, NO_SHOW are terminal
        };
    }
}
