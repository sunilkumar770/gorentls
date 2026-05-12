package com.rentit.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import java.util.Map;

@Component
@Slf4j
public class GracefulWebSocketShutdown {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PreDestroy
    public void onShutdown() {
        log.info("Server shutting down — notifying WebSocket clients");
        // Broadcast shutdown signal so clients reconnect to new instance
        messagingTemplate.convertAndSend("/topic/system",
            Map.of("type", "SERVER_SHUTDOWN",
                   "message", "Server restarting. Reconnecting automatically..."));

        // Brief pause to allow message delivery before connection drops
        try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
    }
}
