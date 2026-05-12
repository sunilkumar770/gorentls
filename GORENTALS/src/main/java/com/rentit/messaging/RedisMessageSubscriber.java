package com.rentit.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentit.dto.messaging.MessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class RedisMessageSubscriber {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public void onMessage(Object message, String channel) {
        try {
            MessageResponse response = objectMapper.convertValue(message, MessageResponse.class);
            
            log.debug("[REDIS] Received message for conv: {}", response.getConversationId());

            // Relay to local WebSocket clients (Global conversation topic)
            messagingTemplate.convertAndSend("/topic/conversation." + response.getConversationId(), response);
            
            // Relay to local WebSocket clients (Private user queue)
            if (response.getRecipientEmail() != null) {
                messagingTemplate.convertAndSendToUser(response.getRecipientEmail(), "/queue/messages", response);
            }
            
        } catch (Exception e) {
            log.error("[REDIS] Failed to process message from Redis: {}", e.getMessage());
        }
    }
}
