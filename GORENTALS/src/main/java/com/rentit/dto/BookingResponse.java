package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private UUID id;
    private ListingResponse listing;
    private UserPublicResponse renter;
    private UserPublicResponse owner;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private BigDecimal rentalAmount;
    private BigDecimal securityDeposit;
    private BigDecimal totalAmount;
    private BigDecimal gstAmount;
    private BigDecimal platformFee;
    private String status;
    private String escrowStatus;
    private String paymentStatus;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
