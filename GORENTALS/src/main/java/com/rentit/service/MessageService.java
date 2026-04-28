package com.rentit.service;

import com.rentit.dto.messaging.*;
import com.rentit.exception.BusinessException;
import com.rentit.model.*;
import com.rentit.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private static final Logger log = LoggerFactory.getLogger(MessageService.class);

    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository  messageRepository;
    private final UserRepository         userRepository;
    private final ListingRepository      listingRepository;
    private final SimpMessagingTemplate  messagingTemplate;

    public MessageService(ConversationRepository conversationRepository,
                          ChatMessageRepository  messageRepository,
                          UserRepository         userRepository,
                          ListingRepository      listingRepository,
                          SimpMessagingTemplate  messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository      = messageRepository;
        this.userRepository         = userRepository;
        this.listingRepository      = listingRepository;
        this.messagingTemplate      = messagingTemplate;
    }

    // ── REAL-TIME CORE ────────────────────────────────────────────────────────
    @Transactional
    public void processIncomingMessage(WsSendMessageRequest request, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
            .orElseThrow(() -> BusinessException.notFound("Sender", senderEmail));
        UUID convId = UUID.fromString(request.getConversationId());
        Conversation conv = conversationRepository.findById(convId)
            .orElseThrow(() -> BusinessException.notFound("Conversation", convId));

        boolean isParticipant =
            conv.getOwner().getId().equals(sender.getId()) ||
            conv.getRenter().getId().equals(sender.getId());
        if (!isParticipant)
            throw BusinessException.forbidden("Not a participant in " + convId);

        // schema alignment: message_text (DB) mapped to messageText (Entity)
        ChatMessage msg = new ChatMessage();
        msg.setConversation(conv);
        msg.setSender(sender);
        msg.setMessageText(request.getMessageText());
        
        if (request.getTempId() != null && !request.getTempId().trim().isEmpty()) {
            try { msg.setTempId(UUID.fromString(request.getTempId())); }
            catch (Exception e) { log.warn("[MSG] Invalid tempId UUID: {}", request.getTempId()); }
        }

        if (request.getMessageType() != null) {
            try { msg.setMessageType(ChatMessage.MessageType.valueOf(request.getMessageType())); }
            catch (IllegalArgumentException e) { msg.setMessageType(ChatMessage.MessageType.TEXT); }
        }
        msg.setStatus(ChatMessage.MessageStatus.SENT);
        messageRepository.save(msg);
        log.info("[MSG] Persisted id={} conv={}", msg.getId(), convId);

        boolean senderIsOwner = conv.getOwner().getId().equals(sender.getId());
        if (senderIsOwner) conv.setRenterUnread(conv.getRenterUnread() + 1);
        else               conv.setOwnerUnread(conv.getOwnerUnread() + 1);
        conversationRepository.save(conv);

        MessageResponse response = mapToMessageResponse(msg);

        // Broadcast 1: both users in the chat room receive instantly
        messagingTemplate.convertAndSend("/topic/conversation." + convId, response);

        // Broadcast 2: recipient inbox → Navbar badge increments without page refresh
        String recipientEmail = senderIsOwner
            ? conv.getRenter().getEmail() : conv.getOwner().getEmail();
        messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/messages", response);
        log.info("[MSG] Broadcast → topic + /user/{}/queue/messages", recipientEmail);
    }

    // ── REST ─────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        return conversationRepository.findAllByParticipantWithMessages(user)
            .stream().map(this::mapToConversationResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        Conversation conv = conversationRepository.findByIdWithMessages(id)
            .orElseThrow(() -> BusinessException.notFound("Conversation", id));
        if (!conv.getOwner().getId().equals(user.getId()) &&
            !conv.getRenter().getId().equals(user.getId()))
            throw BusinessException.forbidden("Access denied to conversation " + id);
        return mapToConversationResponse(conv);
    }

    @Transactional
    public ConversationResponse startConversation(StartConversationRequest request,
                                                   String renterEmail) {
        User renter = userRepository.findByEmail(renterEmail)
            .orElseThrow(() -> BusinessException.notFound("Renter", renterEmail));
        Listing listing = listingRepository.findById(request.getListingId())
            .orElseThrow(() -> BusinessException.notFound("Listing", request.getListingId()));

        return conversationRepository
            .findByListingIdAndRenterId(listing.getId(), renter.getId())
            .map(this::mapToConversationResponse)
            .orElseGet(() -> {
                Conversation conv = new Conversation();
                conv.setListing(listing);
                conv.setOwner(listing.getOwner()); 
                conv.setRenter(renter);
                conversationRepository.save(conv);

                WsSendMessageRequest init = new WsSendMessageRequest();
                init.setConversationId(conv.getId().toString());
                init.setMessageText(request.getMessage());
                init.setMessageType("TEXT");
                processIncomingMessage(init, renterEmail);
                return mapToConversationResponse(
                    conversationRepository.findById(conv.getId()).orElseThrow());
            });
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID conversationId, String userEmail,
                                              int page, int size) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> BusinessException.notFound("Conversation", conversationId));
        if (!conv.getOwner().getId().equals(user.getId()) &&
            !conv.getRenter().getId().equals(user.getId()))
            throw BusinessException.forbidden("Access denied to messages in " + conversationId);
        return messageRepository
            .findByConversationIdOrderByCreatedAtAsc(conversationId, PageRequest.of(page, size))
            .stream().map(this::mapToMessageResponse).collect(Collectors.toList());
    }

    @Transactional
    public void markConversationRead(UUID conversationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> BusinessException.notFound("User", userEmail));

        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> BusinessException.notFound("Conversation", conversationId));

        // SECURITY GATE: user MUST be owner or renter — no other path
        boolean isOwner  = conv.getOwner().getId().equals(user.getId());
        boolean isRenter = conv.getRenter().getId().equals(user.getId());

        if (!isOwner && !isRenter) {
            throw BusinessException.forbidden(
                "Access denied: user " + userEmail + " is not a participant in " + conversationId);
        }

        if (isOwner) {
            conv.setOwnerUnread(0);
        } else {
            conv.setRenterUnread(0);
        }
        conversationRepository.save(conv);
        log.info("[MSG] Read cleared for {} in conv={}", userEmail, conversationId);
    }

    @Transactional
    public void markMessageDelivered(UUID messageId, String userEmail) {
        ChatMessage msg = messageRepository.findById(messageId)
            .orElseThrow(() -> BusinessException.notFound("Message", messageId));

        // Security: only the recipient can mark a message as delivered
        if (msg.getSender().getEmail().equals(userEmail)) return;

        if (msg.getStatus() == ChatMessage.MessageStatus.SENT) {
            msg.setStatus(ChatMessage.MessageStatus.DELIVERED);
            messageRepository.save(msg);
            
            // Broadcast the update back to the conversation so the sender sees the checkmark
            MessageResponse response = mapToMessageResponse(msg);
            messagingTemplate.convertAndSend("/topic/conversation." + msg.getConversation().getId(), response);
            log.info("[MSG] Marked delivered id={} conv={}", messageId, msg.getConversation().getId());
        }
    }

    // ── Mappers ───────────────────────────────────────────────────────────────
    private ConversationResponse mapToConversationResponse(Conversation conv) {
        String lastText = null;
        LocalDateTime lastAt = null;
        if (conv.getMessages() != null && !conv.getMessages().isEmpty()) {
            ChatMessage last = conv.getMessages().get(conv.getMessages().size() - 1);
            lastText = last.getMessageText();
            lastAt   = last.getCreatedAt();
        }
        return ConversationResponse.builder()
            .id(conv.getId())
            .listingId(conv.getListing().getId())
            .listingTitle(conv.getListing().getTitle())
            .ownerId(conv.getOwner().getId())
            .ownerName(conv.getOwner().getFullName())
            .ownerEmail(conv.getOwner().getEmail())
            .renterId(conv.getRenter().getId())
            .renterName(conv.getRenter().getFullName())
            .renterEmail(conv.getRenter().getEmail())
            .lastMessage(lastText)
            .lastMessageAt(lastAt)
            .ownerUnread(conv.getOwnerUnread())
            .renterUnread(conv.getRenterUnread())
            .createdAt(conv.getCreatedAt())
            .build();
    }

    private MessageResponse mapToMessageResponse(ChatMessage m) {
        return MessageResponse.builder()
            .id(m.getId())
            .tempId(m.getTempId() != null ? m.getTempId().toString() : null)
            .conversationId(m.getConversation().getId())
            .senderId(m.getSender().getId())
            .senderName(m.getSender().getFullName())
            .senderEmail(m.getSender().getEmail())
            .messageText(m.getMessageText())
            .messageType(m.getMessageType() != null ? m.getMessageType().name() : "TEXT")
            .status(m.getStatus()      != null ? m.getStatus().name()      : "SENT")
            .createdAt(m.getCreatedAt())
            .build();
    }
}
