package com.rentit.model;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;   // Spring Boot 3.3.6
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "conversations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"listing_id", "renter_id"}))
public class Conversation {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id", nullable = false)
    private User renter;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL,
               fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ChatMessage> messages = new ArrayList<>();

    @Column(name = "owner_unread", nullable = false)
    private int ownerUnread = 0;

    @Column(name = "renter_unread", nullable = false)
    private int renterUnread = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public UUID              getId()                 { return id; }
    public Listing           getListing()            { return listing; }
    public void              setListing(Listing v)   { this.listing = v; }
    public Booking           getBooking()            { return booking; }
    public void              setBooking(Booking v)   { this.booking = v; }
    public User              getOwner()              { return owner; }
    public void              setOwner(User v)        { this.owner = v; }
    public User              getRenter()             { return renter; }
    public void              setRenter(User v)       { this.renter = v; }
    public List<ChatMessage> getMessages()           { return messages; }
    public int               getOwnerUnread()        { return ownerUnread; }
    public void              setOwnerUnread(int n)   { this.ownerUnread = n; }
    public int               getRenterUnread()       { return renterUnread; }
    public void              setRenterUnread(int n)  { this.renterUnread = n; }
    public LocalDateTime     getCreatedAt()          { return createdAt; }
    public LocalDateTime     getUpdatedAt()          { return updatedAt; }
}
