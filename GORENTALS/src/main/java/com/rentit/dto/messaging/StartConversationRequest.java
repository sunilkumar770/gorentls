package com.rentit.dto.messaging;

import jakarta.validation.constraints.NotBlank;   // Spring Boot 3.3.6
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class StartConversationRequest {

    @NotNull(message = "Listing ID is required")
    private UUID listingId;

    @NotBlank(message = "Message cannot be blank")
    private String message;   // matches frontend JSON key "message"

    public StartConversationRequest() {}
    public UUID   getListingId()       { return listingId; }
    public void   setListingId(UUID v) { this.listingId = v; }
    public String getMessage()         { return message; }
    public void   setMessage(String v) { this.message = v; }
}
