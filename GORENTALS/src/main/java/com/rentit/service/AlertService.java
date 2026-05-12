package com.rentit.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Slf4j
@Service
public class AlertService {

    @Value("${alert.webhook.url:}")
    private String alertWebhookUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendCriticalAlert(String subject, String message) {
        log.error("CRITICAL ALERT [{}]: {}", subject, message);
        
        if (alertWebhookUrl == null || alertWebhookUrl.isBlank()) {
            log.debug("No alert webhook configured, skipping external notification.");
            return;
        }

        try {
            Map<String, String> payload = Map.of(
                "text", String.format("*CRITICAL ALERT*\n*Subject:* %s\n*Message:* %s", subject, message)
            );
            restTemplate.postForObject(alertWebhookUrl, payload, String.class);
            log.info("Alert dispatched to webhook successfully.");
        } catch (Exception e) {
            log.error("Failed to send critical alert to webhook: {}", e.getMessage());
        }
    }
}
