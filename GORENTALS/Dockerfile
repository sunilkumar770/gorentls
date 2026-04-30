# ── Build stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ── Runtime stage — distroless for minimal attack surface ─────────────────
# Distroless has no shell, no package manager, no curl — attack surface ≈ 0
FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080

# ── Health check ─────────────────────────────────────────────────────────────
# Uses a pure-Java HTTP client (HealthCheckClient.java) bundled inside app.jar.
# exec-form required because distroless has no shell interpreter.
# --start-period=60s: allow Spring Boot time to start before first check.
HEALTHCHECK \
  --interval=30s \
  --timeout=10s \
  --start-period=60s \
  --retries=3 \
  CMD ["java", "-cp", "/app/app.jar", "com.rentit.health.HealthCheckClient"]

USER nonroot:nonroot
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
