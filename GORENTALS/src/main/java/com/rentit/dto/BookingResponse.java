package com.rentit.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class BookingResponse {
    private UUID id;
    private ListingResponse listing;
    private UserResponse renter;
    private UserResponse owner;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private BigDecimal rentalAmount;
    private BigDecimal securityDeposit;
    private BigDecimal totalAmount;
    private String status;
    private String paymentStatus;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private BookingResponse(Builder builder) {
        this.id = builder.id;
        this.listing = builder.listing;
        this.renter = builder.renter;
        this.owner = builder.owner;
        this.startDate = builder.startDate;
        this.endDate = builder.endDate;
        this.totalDays = builder.totalDays;
        this.rentalAmount = builder.rentalAmount;
        this.securityDeposit = builder.securityDeposit;
        this.totalAmount = builder.totalAmount;
        this.status = builder.status;
        this.paymentStatus = builder.paymentStatus;
        this.razorpayOrderId = builder.razorpayOrderId;
        this.razorpayPaymentId = builder.razorpayPaymentId;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private ListingResponse listing;
        private UserResponse renter;
        private UserResponse owner;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer totalDays;
        private BigDecimal rentalAmount;
        private BigDecimal securityDeposit;
        private BigDecimal totalAmount;
        private String status;
        private String paymentStatus;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder listing(ListingResponse listing) { this.listing = listing; return this; }
        public Builder renter(UserResponse renter) { this.renter = renter; return this; }
        public Builder owner(UserResponse owner) { this.owner = owner; return this; }
        public Builder startDate(LocalDate startDate) { this.startDate = startDate; return this; }
        public Builder endDate(LocalDate endDate) { this.endDate = endDate; return this; }
        public Builder totalDays(Integer totalDays) { this.totalDays = totalDays; return this; }
        public Builder rentalAmount(BigDecimal rentalAmount) { this.rentalAmount = rentalAmount; return this; }
        public Builder securityDeposit(BigDecimal securityDeposit) { this.securityDeposit = securityDeposit; return this; }
        public Builder totalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder paymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; return this; }
        public Builder razorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; return this; }
        public Builder razorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public BookingResponse build() {
            return new BookingResponse(this);
        }
    }

    // Getters
    public UUID getId() { return id; }
    public ListingResponse getListing() { return listing; }
    public UserResponse getRenter() { return renter; }
    public UserResponse getOwner() { return owner; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public Integer getTotalDays() { return totalDays; }
    public BigDecimal getRentalAmount() { return rentalAmount; }
    public BigDecimal getSecurityDeposit() { return securityDeposit; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getStatus() { return status; }
    public String getPaymentStatus() { return paymentStatus; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}