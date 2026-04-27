package com.rentit.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.*;
import io.swagger.v3.oas.models.security.*;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * SpringDoc OpenAPI 3.1 configuration.
 *
 * Swagger UI:  http://localhost:8080/swagger-ui.html
 * OpenAPI JSON: http://localhost:8080/v3/api-docs
 *
 * Authentication:
 *   All protected endpoints require a Bearer JWT.
 *   Use the "Authorize" button in Swagger UI to set the token globally.
 *
 * Servers:
 *   - Local dev:   http://localhost:8080
 *   - Production:  injected from ${app.api.server-url}
 */
@Configuration
public class OpenApiConfig {

    @Value("${app.api.server-url:http://localhost:8080}")
    private String serverUrl;

    @Value("${app.api.version:1.0.0}")
    private String apiVersion;

    @Bean
    public OpenAPI goRentalsOpenAPI() {
        return new OpenAPI()
            .info(apiInfo())
            .servers(List.of(
                new Server().url(serverUrl).description("Active server"),
                new Server().url("http://localhost:8080").description("Local development")
            ))
            .components(new Components()
                .addSecuritySchemes("bearerAuth", bearerScheme())
            )
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .tags(List.of(
                new Tag().name("Payments & Escrow")
                         .description("Razorpay order creation, payment confirmation, and escrow management"),
                new Tag().name("Disputes")
                         .description("Dispute lifecycle — open, review, resolve"),
                new Tag().name("Owner Onboarding")
                         .description("Owner payout account setup via RazorpayX"),
                new Tag().name("Webhooks")
                         .description("Inbound Razorpay event webhooks — not for direct client use")
            ));
    }

    private Info apiInfo() {
        return new Info()
            .title("GoRentals API")
            .version(apiVersion)
            .description("""
                GoRentals rental marketplace API.
                
                **Escrow flow:**
                1. `POST /api/payments/order` → create Razorpay order
                2. Renter completes payment in Razorpay Checkout JS
                3. `POST /api/payments/confirm` → verify signature, apply to escrow
                4. Item handed over → rental proceeds
                5. Item returned → dispute window opens (24 h)
                6. If no dispute → owner payout initiated at T+2
                
                **Authentication:**
                All endpoints (except webhooks and Swagger UI) require a Bearer JWT.
                Obtain a token via `POST /api/auth/login`.
                """)
            .contact(new Contact()
                .name("GoRentals Engineering")
                .email("engineering@gorentals.in"))
            .license(new License()
                .name("Proprietary")
                .url("https://gorentals.in"));
    }

    private SecurityScheme bearerScheme() {
        return new SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .description("JWT issued by POST /api/auth/login. " +
                         "Paste the token value (without 'Bearer ' prefix).");
    }
}
