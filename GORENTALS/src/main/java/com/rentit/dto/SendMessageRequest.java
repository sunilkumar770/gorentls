package com.rentit.dto;

import com.rentit.model.Message.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SendMessageRequest {
    @NotNull private UUID conversationId;
    @NotBlank private String messageText;
    private MessageType messageType = MessageType.TEXT;
    private UUID tempId;

    public UUID getConversationId() { return conversationId; }
    public void setConversationId(UUID v) { this.conversationId = v; }
    public String getMessageText() { return messageText; }
    public void setMessageText(String v) { this.messageText = v; }
    public MessageType getMessageType() { return messageType; }
    public void setMessageType(MessageType v) { this.messageType = v; }
    public UUID getTempId() { return tempId; }
    public void setTempId(UUID v) { this.tempId = v; }
}
