package com.rentit.config;

import com.rentit.interceptor.RateLimitingInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web configuration for interceptors and filters
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Register rate limiting interceptor for /api/** paths
        registry.addInterceptor(new RateLimitingInterceptor())
            .addPathPatterns("/api/**")
            .excludePathPatterns(
                "/api/health",  // Health check should not be rate limited
                "/api/public/**" // Public endpoints may have different limits
            );
    }
}
