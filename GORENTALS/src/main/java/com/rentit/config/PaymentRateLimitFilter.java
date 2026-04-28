package com.rentit.config;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class PaymentRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets;

    public PaymentRateLimitFilter(Map<String, Bucket> buckets) {
        this.buckets = buckets;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String path = request.getRequestURI();
        // Protect payment order, confirm and webhook endpoints
        if (!path.startsWith("/api/payments/") && !path.startsWith("/api/webhooks/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String key = path + ":" + clientIp;
        
        Bucket bucket = buckets.computeIfAbsent(key, k -> {
            if (path.contains("/order")) return new RateLimitConfig().createOrderBucket();
            if (path.contains("/confirm")) return new RateLimitConfig().confirmPaymentBucket();
            // Default limit for other payment/webhook paths
            return io.github.bucket4j.Bucket.builder().addLimit(
                io.github.bucket4j.Bandwidth.classic(20, 
                    io.github.bucket4j.Refill.intervally(20, java.time.Duration.ofMinutes(1)))
            ).build();
        });

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                "{\"error\":\"RATE_LIMITED\",\"retryAfterSeconds\":%d}", 
                probe.getNanosToWaitForRefill() / 1_000_000_000
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) return xf.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
