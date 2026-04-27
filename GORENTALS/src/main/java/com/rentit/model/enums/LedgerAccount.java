package com.rentit.model.enums;

/**
 * Internal ledger accounts used by the double-entry LedgerService.
 *
 * Each account maps to a real-world bucket of money:
 *
 *   RENTER_ESCROW   — money belonging to the renter (advance + final)
 *   OWNER_ESCROW    — money allocated to the owner (released from renter escrow)
 *   PLATFORM_FEE    — GoRentals revenue (5% platform fee)
 *   TAX_TDS         — TDS withheld under Section 194-O (0.1% on owner gross)
 *   TAX_TCS         — TCS collected under Section 52 CGST (1% on net taxable)
 *   SECURITY_HOLD   — refundable security deposit (never part of platform revenue)
 *   BANK_SETTLEMENT — real bank / Razorpay settlement account (entry/exit point)
 *
 * Every ledger entry DEBITS one account and CREDITS another of equal value.
 * Net sum of all entries across all accounts for a booking must always be zero.
 */
public enum LedgerAccount {

    RENTER_ESCROW,
    OWNER_ESCROW,
    PLATFORM_FEE,
    TAX_TDS,
    TAX_TCS,
    SECURITY_HOLD,
    BANK_SETTLEMENT
}
