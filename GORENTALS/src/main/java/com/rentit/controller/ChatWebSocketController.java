package com.rentit.controller;

import com.rentit.dto.messaging.WsSendMessageRequest;
import com.rentit.service.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import java.security.Principal;
import java.util.UUID;

@Controller
public class ChatWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketController.class);
    private final MessageService messageService;

    public ChatWebSocketController(MessageService messageService) {
        this.messageService = messageService;
    }

    @MessageMapping("/chat.send")
    public void handleMessage(@Payload WsSendMessageRequest request, Principal principal) {
        if (principal == null) {
            log.error("[WS] REJECTED — principal null. Check WebSocketConfig.configureClientInboundChannel");
            return;
        }
        log.info("[WS] chat.send from={} conv={} len={}", principal.getName(),
            request.getConversationId(),
            request.getMessageText() != null ? request.getMessageText().length() : 0);
        try {
            messageService.processIncomingMessage(request, principal.getName());
        } catch (Exception e) {
            log.error("[WS] chat.send error: {}", e.getMessage(), e);
        }
    }

    @MessageMapping("/chat.read")
    public void handleMarkRead(@Payload WsSendMessageRequest request, Principal principal) {
        if (principal == null || request.getConversationId() == null) return;
        try {
            messageService.markConversationRead(
                UUID.fromString(request.getConversationId()), principal.getName());
        } catch (Exception e) {
            log.error("[WS] chat.read error: {}", e.getMessage());
        }
    }

    @MessageMapping("/chat.delivered")
    public void handleDelivered(@Payload String messageId, Principal principal) {
        if (principal == null || messageId == null) return;
        try {
            messageService.markMessageDelivered(UUID.fromString(messageId.replace("\"", "")), principal.getName());
        } catch (Exception e) {
            log.error("[WS] chat.delivered error: {}", e.getMessage());
        }
    }
}
