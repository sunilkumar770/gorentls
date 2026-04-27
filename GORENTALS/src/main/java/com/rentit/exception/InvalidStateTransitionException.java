package com.rentit.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a booking or escrow state machine transition is attempted
 * that is not permitted by the current state.
 *
 * Always maps to HTTP 409 CONFLICT — the request is valid in isolation
 * but conflicts with the current resource state.
 *
 * Examples:
 *   - Attempting to mark handover on a PENDING_PAYMENT booking
 *   - Attempting to trigger payout on an ON_HOLD escrow
 *   - Attempting to open a dispute on a COMPLETED booking
 *
 * Usage:
 *   if (!booking.getBookingStatus().canTransitionTo(next)) {
 *       throw new InvalidStateTransitionException(
 *           booking.getBookingStatus(), next, "Booking");
 *   }
 */
public class InvalidStateTransitionException extends BusinessException {

    private final String currentState;
    private final String requestedState;
    private final String entity;

    // ── Constructors ─────────────────────────────────────────────────────────

    /**
     * Enum-aware constructor — preferred in service layer.
     *
     * @param current   current state enum value
     * @param requested requested target state enum value
     * @param entity    entity name for the message e.g. "Booking", "Escrow"
     */
    public InvalidStateTransitionException(
        Enum<?> current,
        Enum<?> requested,
        String entity
    ) {
        super(
            String.format(
                "Cannot transition %s from [%s] to [%s]",
                entity, current.name(), requested.name()
            ),
            HttpStatus.CONFLICT,
            "INVALID_STATE_TRANSITION"
        );
        this.currentState   = current.name();
        this.requestedState = requested.name();
        this.entity         = entity;
    }

    /**
     * String constructor — use when states are not backed by a single enum
     * (e.g. combined booking+escrow transition check).
     */
    public InvalidStateTransitionException(
        String currentState,
        String requestedState,
        String entity
    ) {
        super(
            String.format(
                "Cannot transition %s from [%s] to [%s]",
                entity, currentState, requestedState
            ),
            HttpStatus.CONFLICT,
            "INVALID_STATE_TRANSITION"
        );
        this.currentState   = currentState;
        this.requestedState = requestedState;
        this.entity         = entity;
    }

    /**
     * Message-only constructor — use in BookingEscrowService guard checks
     * where you already have a descriptive message.
     */
    public InvalidStateTransitionException(String message) {
        super(message, HttpStatus.CONFLICT, "INVALID_STATE_TRANSITION");
        this.currentState   = "UNKNOWN";
        this.requestedState = "UNKNOWN";
        this.entity         = "UNKNOWN";
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public String getCurrentState()   { return currentState; }
    public String getRequestedState() { return requestedState; }
    public String getEntity()         { return entity; }
}
