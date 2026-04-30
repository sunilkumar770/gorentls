package com.rentit.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class StartupEnvValidator {

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:}")
    private String razorpayKeySecret;

    @Value("${cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @PostConstruct
    public void validate() {
        List<String> missing = new ArrayList<>();

        if (isBlank(dbUrl)) missing.add("DB_URL");
        if (isBlank(dbUsername)) missing.add("DB_USERNAME");
        if (isBlank(dbPassword)) missing.add("DB_PASSWORD");
        if (isBlank(jwtSecret)) missing.add("JWT_SECRET");
        if (isBlank(razorpayKeyId)) missing.add("RAZORPAY_KEY_ID");
        if (isBlank(razorpayKeySecret)) missing.add("RAZORPAY_KEY_SECRET");
        if (isBlank(cloudinaryCloudName)) missing.add("CLOUDINARY_CLOUD_NAME");

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "Missing required environment variables: " + String.join(", ", missing)
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
