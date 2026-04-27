package com.rentit.model.enums;

/**
 * Direction of a ledger entry.
 *
 *   DEBIT  — money leaves an account (liability increases or asset decreases)
 *   CREDIT — money enters an account (liability decreases or asset increases)
 *
 * Every LedgerService.post() call produces exactly one DEBIT + one CREDIT row.
 */
public enum LedgerDirection {
    DEBIT,
    CREDIT
}
