package com.rentit.controller;

import com.rentit.dto.OwnerAnalyticsDTO;
import com.rentit.dto.RevenuePointDTO;
import com.rentit.model.User;
import com.rentit.repository.UserRepository;
import com.rentit.service.OwnerAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER') or hasRole('ADMIN')")
public class OwnerAnalyticsController {

    private final OwnerAnalyticsService analyticsService;
    private final UserRepository userRepository;

    @GetMapping("/analytics")
    public ResponseEntity<OwnerAnalyticsDTO> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUsername()));
        return ResponseEntity.ok(analyticsService.getAnalytics(user.getId()));
    }

    @GetMapping("/analytics/revenue-chart")
    public ResponseEntity<List<RevenuePointDTO>> getRevenueChart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "6") int months) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + userDetails.getUsername()));
        return ResponseEntity.ok(analyticsService.getRevenueTrend(user.getId(), months));
    }
}
