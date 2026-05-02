package com.rentit.model;

import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "listings")
public class Listing {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    
    @Column(nullable = false, length = 255)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 100)
    private String category;
    
    @Column(length = 100)
    private String type;
    
    @Column(name = "price_per_day", nullable = false)
    private BigDecimal pricePerDay;
    
    @Column(name = "security_deposit")
    private BigDecimal securityDeposit;
    
    @Column(length = 255)
    private String location;
    
    @Column(length = 100)
    private String city;
    
    @Column(length = 100)
    private String state;
    
    private BigDecimal latitude;
    
    private BigDecimal longitude;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Object specifications;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> images;
    
    @Builder.Default
    @Column(name = "is_available")
    private Boolean isAvailable = true;
    
    @Builder.Default
    @Column(name = "is_published")
    private Boolean isPublished = false;
    
    @Builder.Default
    @Column(name = "total_ratings")
    private BigDecimal totalRatings = BigDecimal.ZERO;
    
    @Builder.Default
    @Column(name = "rating_count")
    private Integer ratingCount = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
