package com.rentit.dto.payment;

import com.rentit.model.enums.EscrowStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EscrowSummaryResponse(
    UUID    bookingId,
    EscrowStatus escrowStatus,
    BigDecimal advanceAmount,
    BigDecimal remainingAmount,
    BigDecimal securityDeposit,
    BigDecimal platformFee,
    BigDecimal gstAmount,
    BigDecimal totalCollected,
    Instant  disputeWindowEndsAt,
    boolean  disputeWindowOpen
) {}
