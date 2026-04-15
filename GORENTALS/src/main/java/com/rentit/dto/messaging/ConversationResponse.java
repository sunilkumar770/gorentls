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

    // Flat owner fields for chat page
    private UUID          ownerId;
    private String        ownerName;
    private String        ownerEmail;

    // Flat renter fields for chat page
    private UUID          renterId;
    private String        renterName;
    private String        renterEmail;

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
        private String email;
        private String phone;
    }
}
