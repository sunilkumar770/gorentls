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

    @Query("SELECT c FROM Conversation c WHERE c.owner = :user OR c.renter = :user " +
           "ORDER BY c.updatedAt DESC")
    List<Conversation> findAllByParticipant(@Param("user") User user);

    Optional<Conversation> findByListingIdAndRenterId(UUID listingId, UUID renterId);
}
