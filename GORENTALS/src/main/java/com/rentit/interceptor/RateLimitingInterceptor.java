package com.rentit.interceptor;

import com.rentit.config.RateLimitingConfig;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * HTTP Interceptor for rate limiting.
 * Applies appropriate rate limits based on endpoint and client IP.
 */
public class RateLimitingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String clientIp = getClientIp(request);
        String requestPath = request.getRequestURI();

        // Determine which bucket to use based on endpoint
        Bucket bucket = getBucketForEndpoint(requestPath, clientIp);

        if (bucket != null) {
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (probe.isConsumed()) {
                // Request allowed - set remaining tokens in header
                response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
                return true;
            } else {
                // Rate limit exceeded
                long waitForRefill = (probe.getNanosToWait() / 1_000_000_000) + 1;
                response.setStatus(429); // Too Many Requests
                response.addHeader("Retry-After", String.valueOf(waitForRefill));
                response.addHeader("X-Rate-Limit-Limit", "exceeded");
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Rate limit exceeded. Retry after " + waitForRefill + " seconds.\"}");
                return false;
            }
        }

        return true;
    }

    /**
     * Get appropriate bucket based on endpoint path
     */
    private Bucket getBucketForEndpoint(String path, String clientIp) {
        if (path.contains("/auth/login") || path.contains("/auth/register") || path.contains("/users/register")) {
            if (path.contains("/register")) {
                return RateLimitingConfig.getRegistrationBucket(clientIp);
            } else {
                return RateLimitingConfig.getAuthenticationBucket(clientIp);
            }
        } else if (path.contains("/upload") || path.contains("/files")) {
            return RateLimitingConfig.getFileUploadBucket(clientIp);
        }
        // Global rate limit for all endpoints
        return RateLimitingConfig.getGlobalBucket();
    }

    /**
     * Extract client IP address from request
     * Handles X-Forwarded-For header for proxied requests
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
