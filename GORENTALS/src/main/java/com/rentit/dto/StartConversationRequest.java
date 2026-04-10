package com.rentit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class StartConversationRequest {
    @NotNull(message = "listingId is required")
    private UUID listingId;
    
    @NotBlank(message = "initialMessage cannot be blank")
    private String initialMessage;

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }
    public String getInitialMessage() { return initialMessage; }
    public void setInitialMessage(String v) { this.initialMessage = v; }
}
