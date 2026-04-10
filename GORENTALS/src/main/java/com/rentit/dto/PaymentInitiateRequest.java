package com.rentit.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class PaymentInitiateRequest {
    private UUID bookingId;

	public UUID getBookingId() {
		return bookingId;
	}

	public void setBookingId(UUID bookingId) {
		this.bookingId = bookingId;
	}
}