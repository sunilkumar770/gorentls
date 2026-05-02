package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingResponse {
    private UUID id;
    private UserPublicResponse owner;
    private String title;
    private String description;
    private String category;
    private String type;
    private BigDecimal pricePerDay;
    private BigDecimal securityDeposit;
    private String location;
    private String city;
    private String state;
    private Object specifications;
    private List<String> images;
    private Boolean isAvailable;
    private Boolean isPublished;
    private BigDecimal totalRatings;
    private Integer ratingCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
