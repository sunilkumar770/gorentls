package com.rentit.config;

import jakarta.annotation.PostConstruct;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates required environment variables on application startup.
 * Fails fast with clear error message if any required config is missing.
 */
@Component
public class ConfigurationValidator {

    private static final List<String> REQUIRED_ENV_VARS = List.of(
            "DB_URL",
            "DB_USERNAME",
            "DB_PASSWORD",
            "JWT_SECRET",
            "RAZORPAY_KEY_ID",
            "RAZORPAY_KEY_SECRET"
    );

    private final Environment env;

    public ConfigurationValidator(Environment environment) {
        this.env = environment;
    }

    @PostConstruct
    public void validateConfiguration() {
        List<String> missingVars = new ArrayList<>();

        for (String var : REQUIRED_ENV_VARS) {
            String value = env.getProperty(var);
            if (value == null || value.trim().isEmpty()) {
                missingVars.add(var);
            }
        }

        if (!missingVars.isEmpty()) {
            throw new IllegalStateException(
                    "\n\n❌ [GoRentals] Missing required environment variables:\n" +
                    String.join("\n", missingVars.stream().map(v -> " • " + v).toList()) +
                    "\n\nPlease set these environment variables before starting the application.\n" +
                    "Reference: GORENTALS/.env.example\n"
            );
        }
    }
}
