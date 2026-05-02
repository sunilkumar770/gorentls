package com.rentit.config;

import com.rentit.interceptor.RateLimitingInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web configuration for interceptors and filters
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final RateLimitingInterceptor rateLimitingInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Register rate limiting interceptor for /api/** paths
        registry.addInterceptor(rateLimitingInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns(
                "/api/health",  // Health check should not be rate limited
                "/api/public/**" // Public endpoints may have different limits
            );
    }
}
