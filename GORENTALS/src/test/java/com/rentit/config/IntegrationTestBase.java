package com.rentit.config;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Assumptions;

/**
 * Shared base for all integration tests.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    static final PostgreSQLContainer<?> POSTGRES =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("gorentals_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);

    @BeforeAll
    static void setup() {
        boolean enabled = Boolean.parseBoolean(System.getProperty("testcontainers.enabled", "false"));
        Assumptions.assumeTrue(enabled, "Skipping: testcontainers.enabled is not true");
        
        try {
            if (!POSTGRES.isRunning()) {
                POSTGRES.start();
            }
        } catch (Exception e) {
            Assumptions.assumeTrue(false, "Skipping: Docker failed to start: " + e.getMessage());
        }
    }

    @DynamicPropertySource
    static void overrideDataSource(DynamicPropertyRegistry registry) {
        // Only provide these if running; if skipped by assumption, these won't matter
        if (POSTGRES.isRunning()) {
            registry.add("spring.datasource.url",      POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username",  POSTGRES::getUsername);
            registry.add("spring.datasource.password",  POSTGRES::getPassword);
        }
        registry.add("spring.flyway.enabled",       () -> "true");
    }
}
