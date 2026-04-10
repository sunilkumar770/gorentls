package com.rentit.repository;

import com.rentit.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c JOIN FETCH c.listing JOIN FETCH c.renter JOIN FETCH c.owner " +
           "WHERE c.renter.id = :userId OR c.owner.id = :userId " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") UUID userId);

    Optional<Conversation> findByListingIdAndRenterId(UUID listingId, UUID renterId);

    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Conversation c " +
           "WHERE c.id = :conversationId AND (c.renter.id = :userId OR c.owner.id = :userId)")
    boolean isParticipant(@Param("conversationId") UUID conversationId, @Param("userId") UUID userId);
}
