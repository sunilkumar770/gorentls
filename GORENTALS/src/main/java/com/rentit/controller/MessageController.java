package com.rentit.controller;

import com.rentit.dto.SendMessageRequest;
import com.rentit.service.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
public class MessageController {

    private static final Logger log = LoggerFactory.getLogger(MessageController.class);

    @Autowired private MessageService messageService;

    @MessageMapping("/chat.send")
    public void handleSend(@Payload SendMessageRequest req, Principal principal) {
        if (principal == null) { 
            log.warn("Unauthenticated WS message dropped"); 
            return; 
        }
        messageService.sendMessage(req, principal.getName());
    }

    @MessageMapping("/chat.read")
    public void handleRead(@Payload ReadRequest req, Principal principal) {
        if (principal == null) return;
        messageService.markAsRead(req.getConversationId(), principal.getName());
    }

    public static class ReadRequest {
        private UUID conversationId;
        public UUID getConversationId() { return conversationId; }
        public void setConversationId(UUID id) { this.conversationId = id; }
    }
}
