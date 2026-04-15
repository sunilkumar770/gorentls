package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiatePaymentResponse {

    private String orderId;    // Razorpay order ID — "order_XXXX"
    private long   amount;     // in PAISE (₹1 = 100 paise)
    private String currency;   // "INR"
    private String keyId;      // Razorpay public key (safe for frontend)
    private String bookingId;
}
