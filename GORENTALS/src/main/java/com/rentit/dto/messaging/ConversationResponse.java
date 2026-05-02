package com.rentit.dto.messaging;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;
import java.time.LocalDateTime;

@Data @Builder
public class ConversationResponse {
    private UUID          id;
    private UUID          listingId;
    private String        listingTitle;
    private String        listingImage;

    // Flat owner fields for chat page (Protected)
    private UUID          ownerId;
    private String        ownerName;

    // Flat renter fields for chat page (Protected)
    private UUID          renterId;
    private String        renterName;

    // Unread counts for each participant
    private int           ownerUnread;
    private int           renterUnread;
    
    private String        lastMessage;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;

    // For inbox list compatibility
    private OtherUserDto  otherUser;

    @Data @Builder
    public static class OtherUserDto {
        private UUID   id;
        private String fullName;
        // PII (email, phone) removed for privacy
    }
}
