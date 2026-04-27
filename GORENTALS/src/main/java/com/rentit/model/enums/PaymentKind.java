package com.rentit.model.enums;

/**
 * Classifies what an individual incoming payment from the PG represents.
 *
 * A single booking can have multiple Payment rows with different kinds:
 *   - Row 1: ADVANCE          (30% at booking time)
 *   - Row 2: FINAL            (remaining 70% at handover)
 *   - Row 3: SECURITY_DEPOSIT (held separately, refundable)
 *   - Row 4: PENALTY          (late return or damage charge if auto-collected)
 *   - Row 5: REFUND           (outgoing — recorded for audit)
 */
public enum PaymentKind {

    ADVANCE,           // initial booking commitment (30% of rental total)
    FINAL,             // remaining rental balance collected at handover
    SECURITY_DEPOSIT,  // refundable deposit, held in SECURITY_HOLD ledger account
    PENALTY,           // auto-charged penalty (e.g. late return fee)
    REFUND             // refund disbursed to renter (outgoing, recorded for audit)
}
