package com.rentit.repository;

import com.rentit.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    
    long countByUserIdAndIsReadFalse(UUID userId);
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllRead(@Param("userId") UUID userId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) " +
                   "SELECT gen_random_uuid(), id, :title, :message, :type, false, now() FROM users", 
           nativeQuery = true)
    void broadcast(@Param("title") String title, @Param("message") String message, @Param("type") String type);
}
