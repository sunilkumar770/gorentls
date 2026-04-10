package com.rentit.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class TransactionResponse {
    private UUID id;
    private UUID bookingId;
    private String bookingTitle;
    private UserResponse user;
    private BigDecimal amount;
    private String paymentType;
    private String status;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime createdAt;

    private TransactionResponse(Builder builder) {
        this.id = builder.id;
        this.bookingId = builder.bookingId;
        this.bookingTitle = builder.bookingTitle;
        this.user = builder.user;
        this.amount = builder.amount;
        this.paymentType = builder.paymentType;
        this.status = builder.status;
        this.razorpayOrderId = builder.razorpayOrderId;
        this.razorpayPaymentId = builder.razorpayPaymentId;
        this.createdAt = builder.createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private UUID bookingId;
        private String bookingTitle;
        private UserResponse user;
        private BigDecimal amount;
        private String paymentType;
        private String status;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private LocalDateTime createdAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder bookingId(UUID bookingId) { this.bookingId = bookingId; return this; }
        public Builder bookingTitle(String bookingTitle) { this.bookingTitle = bookingTitle; return this; }
        public Builder user(UserResponse user) { this.user = user; return this; }
        public Builder amount(BigDecimal amount) { this.amount = amount; return this; }
        public Builder paymentType(String paymentType) { this.paymentType = paymentType; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder razorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; return this; }
        public Builder razorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public TransactionResponse build() {
            return new TransactionResponse(this);
        }
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getBookingId() { return bookingId; }
    public String getBookingTitle() { return bookingTitle; }
    public UserResponse getUser() { return user; }
    public BigDecimal getAmount() { return amount; }
    public String getPaymentType() { return paymentType; }
    public String getStatus() { return status; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}