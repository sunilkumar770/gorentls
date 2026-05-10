package com.rentit.repository;

import com.rentit.model.RefundOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

public interface RefundOutboxRepository extends JpaRepository<RefundOutbox, UUID> {
    List<RefundOutbox> findByStatusAndNextRetryAtBefore(String status, LocalDateTime now);
    List<RefundOutbox> findByStatusIn(List<String> statuses);
}
