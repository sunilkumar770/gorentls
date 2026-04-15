package com.rentit.repository;

import com.rentit.model.BlockedDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockedDateRepository extends JpaRepository<BlockedDate, UUID> {

    List<BlockedDate> findByListing_Id(UUID listingId);

    Optional<BlockedDate> findByListing_IdAndBooking_Id(UUID listingId, UUID bookingId);

    void deleteByListing_IdAndBooking_Id(UUID listingId, UUID bookingId);

    @Query("SELECT COUNT(b) > 0 FROM BlockedDate b WHERE b.listing.id = :listingId " +
           "AND ((b.startDate <= :endDate AND b.endDate >= :startDate))")
    boolean isDateRangeBlocked(@Param("listingId") UUID listingId,
                                @Param("startDate") LocalDate startDate,
                                @Param("endDate") LocalDate endDate);
}
