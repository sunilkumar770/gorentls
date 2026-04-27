package com.rentit.dto;

import lombok.Data;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class BookingRequest {
    @NotNull(message = "Listing ID is required")
    private UUID listingId;
    
    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date cannot be in the past")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    @FutureOrPresent(message = "End date cannot be in the past")
    private LocalDate endDate;

	public UUID getListingId() {
		return listingId;
	}

	public void setListingId(UUID listingId) {
		this.listingId = listingId;
	}

	public LocalDate getStartDate() {
		return startDate;
	}

	public void setStartDate(LocalDate startDate) {
		this.startDate = startDate;
	}

	public LocalDate getEndDate() {
		return endDate;
	}

	public void setEndDate(LocalDate endDate) {
		this.endDate = endDate;
	}
}