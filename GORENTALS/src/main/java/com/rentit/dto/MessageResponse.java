package com.rentit.dto;

import com.rentit.model.Message;
import com.rentit.model.Message.MessageStatus;
import com.rentit.model.Message.MessageType;
import java.time.LocalDateTime;
import java.util.UUID;

public class MessageResponse {
    private UUID id, conversationId, senderId, tempId;
    private String senderName, senderEmail, messageText;
    private MessageType messageType;
    private MessageStatus status;
    private LocalDateTime createdAt;

    public static MessageResponse from(Message m) {
        MessageResponse r = new MessageResponse();
        r.id = m.getId();
        r.conversationId = m.getConversation().getId();
        r.senderId = m.getSender().getId();
        r.senderName = m.getSender().getFullName();
        r.senderEmail = m.getSender().getEmail();
        r.messageText = m.getMessageText();
        r.messageType = m.getMessageType();
        r.status = m.getStatus();
        r.tempId = m.getTempId();
        r.createdAt = m.getCreatedAt();
        return r;
    }

    public UUID getId() { return id; }
    public UUID getConversationId() { return conversationId; }
    public UUID getSenderId() { return senderId; }
    public String getSenderName() { return senderName; }
    public String getSenderEmail() { return senderEmail; }
    public String getMessageText() { return messageText; }
    public MessageType getMessageType() { return messageType; }
    public MessageStatus getStatus() { return status; }
    public UUID getTempId() { return tempId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
