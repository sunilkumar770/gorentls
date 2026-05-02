package com.rentit.dto.messaging;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
    private UUID id;
    private String tempId;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String messageText;
    private String messageType;
    private String status;
    private boolean read;
    private LocalDateTime createdAt;
}
