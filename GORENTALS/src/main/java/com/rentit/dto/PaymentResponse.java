package com.rentit.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class PaymentResponse {
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String key;
    private UUID bookingId;

    public PaymentResponse() {
    }

    private PaymentResponse(Builder builder) {
        this.orderId = builder.orderId;
        this.amount = builder.amount;
        this.currency = builder.currency;
        this.key = builder.key;
        this.bookingId = builder.bookingId;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private BigDecimal amount;
        private String currency;
        private String key;
        private UUID bookingId;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder key(String key) {
            this.key = key;
            return this;
        }

        public Builder bookingId(UUID bookingId) {
            this.bookingId = bookingId;
            return this;
        }

        public PaymentResponse build() {
            return new PaymentResponse(this);
        }
    }

    // Getters and Setters
    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }
}