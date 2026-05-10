package com.rentit.exception;

import lombok.Getter;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
public class RefundFailedException extends RuntimeException {
    private final UUID bookingId;
    private final String paymentId;
    private final BigDecimal amount;

    public RefundFailedException(String message, UUID bookingId, String paymentId, BigDecimal amount, Throwable cause) {
        super(message, cause);
        this.bookingId = bookingId;
        this.paymentId = paymentId;
        this.amount = amount;
    }
}
