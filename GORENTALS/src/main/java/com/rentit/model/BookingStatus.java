package com.rentit.model;

public enum BookingStatus {

    // ── Active states ──────────────────────────────────────────────────────
    PENDING,        // Created by renter; awaiting owner action
    ACCEPTED,       // Owner accepted; awaiting renter payment
    CONFIRMED,      // Payment received; booking locked in
    IN_PROGRESS,    // Rental period is currently active
    COMPLETED,      // Item returned; booking closed successfully

    // ── Terminal negative states ───────────────────────────────────────────
    CANCELLED,      // Cancelled by renter, owner, or admin before completion
    REJECTED        // Rejected by owner before payment
}
