package com.rentit.repository;

import com.rentit.model.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {
    boolean existsByEventId(String eventId);
}
