package com.rentit.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Represents a renter's saved/favourited listing.
 * Uniqueness is enforced at DB level via UNIQUE(user_id, listing_id).
 */
@Entity
@Table(name = "favorites",
       uniqueConstraints = @UniqueConstraint(
               name = "uk_favorites_renter_listing",
               columnNames = {"user_id", "listing_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"renter", "listing"})   // avoid LazyInitializationException in logs
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    /** The renter who saved this listing. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User renter;

    /** The listing that was saved. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false, updatable = false)
    private Listing listing;

    /** Set automatically on insert. */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
