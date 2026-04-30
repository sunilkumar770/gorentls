package com.rentit.health;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Standalone health-check client used by the Docker HEALTHCHECK instruction.
 *
 * Called as: java -cp app.jar com.rentit.health.HealthCheckClient
 *
 * Exits 0 if the Spring Boot Actuator /actuator/health endpoint returns HTTP 200
 * with "UP" in the body. Exits 1 on any failure.
 *
 * This approach is required for distroless images which have no shell,
 * wget, or curl available.
 */
public class HealthCheckClient {

    private static final String HEALTH_URL = "http://localhost:8080/actuator/health";
    private static final Duration TIMEOUT   = Duration.ofSeconds(5);

    public static void main(String[] args) {
        try {
            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .build();

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(HEALTH_URL))
                .timeout(TIMEOUT)
                .GET()
                .build();

            HttpResponse<String> response =
                client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body().contains("\"UP\"")) {
                System.out.println("[HealthCheck] OK — status=UP");
                System.exit(0);
            } else {
                System.err.printf("[HealthCheck] FAILED — HTTP %d body=%s%n",
                    response.statusCode(), response.body());
                System.exit(1);
            }

        } catch (Exception e) {
            System.err.println("[HealthCheck] FAILED — " + e.getMessage());
            System.exit(1);
        }
    }
}
