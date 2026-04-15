package com.rentit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {

    private List<BlockedRange> blockedRanges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlockedRange {
        private java.util.UUID id;
        private LocalDate startDate;
        private LocalDate endDate;
        private String reason; // MANUAL or BOOKING
    }
}
