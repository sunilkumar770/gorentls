package com.rentit.dto.messaging;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Updated MessageResponse — aligned with frontend IncomingMessage interface.
 * Fixed: renamed 'content' to 'messageText' so bubbles render correctly.
 */
@Data @Builder
public class MessageResponse {
    private UUID          id;
    private String        tempId;         // echoed for optimistic message swap
    private UUID          conversationId;
    private UUID          senderId;
    private String        senderName;
    private String        senderEmail;
    private String        messageText;    // matched to frontend 'messageText'
    private String        messageType;   // "TEXT" | "IMAGE" | "SYSTEM"
    private String        status;        // "SENT" | "DELIVERED" | "READ"
    private boolean       read;
    private LocalDateTime createdAt;
}
