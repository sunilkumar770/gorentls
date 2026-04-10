package com.rentit.service;

import com.rentit.dto.*;
import com.rentit.model.*;
import com.rentit.model.Message.MessageStatus;
import com.rentit.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

    @Autowired private ConversationRepository conversationRepo;
    @Autowired private MessageRepository messageRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private ListingRepository listingRepo;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ConversationResponse startConversation(StartConversationRequest req, String renterEmail) {
        User renter = findUserByEmail(renterEmail);
        Listing listing = listingRepo.findById(req.getListingId())
                .orElseThrow(() -> new RuntimeException("Listing not found: " + req.getListingId()));
        User owner = listing.getOwner();
        
        if (owner.getId().equals(renter.getId())) {
            throw new IllegalArgumentException("Owner cannot message their own listing");
        }

        Conversation conv = conversationRepo
                .findByListingIdAndRenterId(listing.getId(), renter.getId())
                .orElseGet(() -> {
                    Conversation c = new Conversation();
                    c.setListing(listing); 
                    c.setRenter(renter); 
                    c.setOwner(owner);
                    return conversationRepo.save(c);
                });

        if (req.getInitialMessage() != null && !req.getInitialMessage().isBlank()) {
            SendMessageRequest msgReq = new SendMessageRequest();
            msgReq.setConversationId(conv.getId());
            msgReq.setMessageText(req.getInitialMessage());
            msgReq.setMessageType(Message.MessageType.TEXT);
            sendMessage(msgReq, renterEmail);
        }
        
        return ConversationResponse.from(conversationRepo.findById(conv.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String userEmail) {
        User user = findUserByEmail(userEmail);
        return conversationRepo.findAllByUserId(user.getId())
                .stream()
                .map(ConversationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversation(UUID id, String userEmail) {
        User user = findUserByEmail(userEmail);
        assertParticipant(id, user.getId());
        return ConversationResponse.from(conversationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversation not found")));
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(UUID conversationId, String userEmail, int page, int size) {
        User user = findUserByEmail(userEmail);
        assertParticipant(conversationId, user.getId());
        return messageRepo.findByConversationId(conversationId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()))
                .stream()
                .map(MessageResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(UUID conversationId, String userEmail) {
        User user = findUserByEmail(userEmail);
        assertParticipant(conversationId, user.getId());
        messageRepo.markAllAsRead(conversationId, user.getId());
        
        conversationRepo.findById(conversationId).ifPresent(conv -> {
            if (conv.getRenter().getId().equals(user.getId())) {
                conv.setRenterUnread(0);
            } else {
                conv.setOwnerUnread(0);
            }
            conversationRepo.save(conv);
        });
    }

    @Transactional
    public MessageResponse sendMessage(SendMessageRequest req, String senderEmail) {
        User sender = findUserByEmail(senderEmail);
        assertParticipant(req.getConversationId(), sender.getId());
        
        Conversation conv = conversationRepo.findById(req.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        Message msg = new Message();
        msg.setConversation(conv); 
        msg.setSender(sender);
        msg.setMessageText(req.getMessageText());
        msg.setMessageType(req.getMessageType() != null ? req.getMessageType() : Message.MessageType.TEXT);
        msg.setStatus(MessageStatus.SENT); 
        msg.setTempId(req.getTempId());
        Message saved = messageRepo.save(msg);

        boolean senderIsRenter = conv.getRenter().getId().equals(sender.getId());
        conv.setLastMessage(req.getMessageText()); 
        conv.setLastMessageAt(LocalDateTime.now());
        
        if (senderIsRenter) {
            conv.setOwnerUnread(conv.getOwnerUnread() + 1);
        } else {
            conv.setRenterUnread(conv.getRenterUnread() + 1);
        }
        conversationRepo.save(conv);

        MessageResponse response = MessageResponse.from(saved);
        User recipient = senderIsRenter ? conv.getOwner() : conv.getRenter();

        // Push to both participants
        messagingTemplate.convertAndSend("/topic/conversation." + conv.getId(), response);
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/messages", response);

        saved.setStatus(MessageStatus.DELIVERED);
        messageRepo.save(saved);
        
        return MessageResponse.from(saved);
    }

    private User findUserByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private void assertParticipant(UUID conversationId, UUID userId) {
        if (!conversationRepo.isParticipant(conversationId, userId)) {
            throw new SecurityException("Access denied to conversation " + conversationId);
        }
    }
}
