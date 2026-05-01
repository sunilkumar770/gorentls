package com.rentit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import java.util.Collections;

/**
 * CORS Configuration for GoRentals API.
 * 
 * Configures allowed origins, methods, headers, and credentials for cross-origin requests.
 * Production: Restrict to specific frontend domain
 * Development: Allow localhost on multiple ports
 */
@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOriginsString;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,PATCH,OPTIONS}")
    private String allowedMethodsString;

    @Value("${cors.allowed-headers:*}")
    private String allowedHeadersString;

    @Value("${cors.expose-headers:Authorization,X-Total-Count}")
    private String exposeHeadersString;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${cors.max-age:3600}")
    private long maxAge;

    /**
     * Configure CORS for all endpoints under /api/
     * 
     * Mapping: /api/** → CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse comma-separated allowed origins
        String[] origins = allowedOriginsString.split(",");
        configuration.setAllowedOrigins(Arrays.asList(origins));

        // Parse comma-separated allowed methods
        String[] methods = allowedMethodsString.split(",");
        configuration.setAllowedMethods(Arrays.asList(methods));

        // Parse comma-separated allowed headers
        if ("*".equals(allowedHeadersString.trim())) {
            configuration.setAllowedHeaders(Collections.singletonList("*"));
        } else {
            String[] headers = allowedHeadersString.split(",");
            configuration.setAllowedHeaders(Arrays.asList(headers));
        }

        // Headers to expose to client
        String[] exposeHeaders = exposeHeadersString.split(",");
        configuration.setExposedHeaders(Arrays.asList(exposeHeaders));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(allowCredentials);

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(maxAge);

        // Apply to all /api/** endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        source.registerCorsConfiguration("/ws/**", configuration); // Also allow WS for chat
        
        return source;
    }
}
