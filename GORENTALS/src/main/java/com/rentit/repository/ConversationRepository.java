package com.rentit.repository;

import com.rentit.model.Conversation;
import com.rentit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c " +
           "JOIN FETCH c.owner " +
           "JOIN FETCH c.renter " +
           "JOIN FETCH c.listing " +
           "WHERE c.owner = :user OR c.renter = :user " +
           "ORDER BY c.updatedAt DESC")
    List<Conversation> findAllByParticipant(@Param("user") User user);

    @Query("""
        SELECT c FROM Conversation c
        LEFT JOIN FETCH c.owner
        LEFT JOIN FETCH c.renter
        LEFT JOIN FETCH c.listing
        WHERE c.id = :id
        """)
    Optional<Conversation> findByIdOptimized(@Param("id") UUID id);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Conversation c SET c.ownerUnread = c.ownerUnread + 1, c.updatedAt = :now WHERE c.id = :id")
    void incrementOwnerUnread(@Param("id") UUID id, @Param("now") java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Conversation c SET c.renterUnread = c.renterUnread + 1, c.updatedAt = :now WHERE c.id = :id")
    void incrementRenterUnread(@Param("id") UUID id, @Param("now") java.time.LocalDateTime now);

    Optional<Conversation> findByListingIdAndRenterId(UUID listingId, UUID renterId);
}
