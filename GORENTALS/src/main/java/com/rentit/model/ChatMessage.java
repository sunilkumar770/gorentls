package com.rentit.model;

import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.*;   // Spring Boot 3.3.6
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages") // Renamed from "messages" to fix F1 and follow conventions
public class ChatMessage {

    public enum MessageType   { TEXT, IMAGE, SYSTEM }
    public enum MessageStatus { SENT, DELIVERED, READ }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "temp_id")
    private UUID tempId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText; // Corrected column name to match V3 migration

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType = MessageType.TEXT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageStatus status = MessageStatus.SENT;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public UUID          getId()                         { return id; }
    public UUID          getTempId()                     { return tempId; }
    public void          setTempId(UUID v)               { this.tempId = v; }
    public Conversation  getConversation()               { return conversation; }
    public void          setConversation(Conversation v) { this.conversation = v; }
    public User              getSender()                     { return sender; }
    public void              setSender(User v)               { this.sender = v; }
    public String            getMessageText()                { return messageText; }
    public void              setMessageText(String v)        { this.messageText = v; }
    public MessageType   getMessageType()                { return messageType; }
    public void          setMessageType(MessageType v)   { this.messageType = v; }
    public MessageStatus getStatus()                     { return status; }
    public void          setStatus(MessageStatus v)      { this.status = v; }
    public LocalDateTime getCreatedAt()                  { return createdAt; }
}
