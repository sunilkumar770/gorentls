package com.rentit.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import javax.crypto.SecretKey;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    /** Read refresh expiry from config (was hardcoded before — BE-02 fix) */
    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;

    @jakarta.annotation.PostConstruct
    public void validateSecret() {
        if (secret == null || secret.isBlank() || secret.contains("your-secret-key")) {
            logger.error("FATAL: JWT_SECRET is not set or using default value!");
            throw new IllegalStateException("JWT_SECRET env var is not set. Refusing to start.");
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) { logger.error("JWT token expired: {}", e.getMessage()); throw e; }
        catch (MalformedJwtException e) { logger.error("Invalid JWT token: {}", e.getMessage()); throw e; }
        catch (SecurityException e)     { logger.error("Invalid JWT signature: {}", e.getMessage()); throw e; }
        catch (Exception e)             { logger.error("Error parsing JWT token: {}", e.getMessage()); throw e; }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        // Normalize RENTER to USER for frontend role consistency
        String normalizedRole = "RENTER".equals(role) ? "USER" : role;
        claims.put("role", normalizedRole);
        claims.put("created", new Date());
        return createToken(claims, username);
    }

    public String generateRefreshToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("created", new Date());
        return createRefreshToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    /** Uses configured jwt.refresh-expiration (not hardcoded formula) — BE-02 fix */
    private String createRefreshToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            logger.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public String extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return (String) claims.get("role");
        } catch (Exception e) {
            logger.error("Failed to extract role from token: {}", e.getMessage());
            return null;
        }
    }

    public Boolean isRefreshToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "refresh".equals((String) claims.get("type"));
        } catch (Exception e) { return false; }
    }

    public Long getExpirationMs()      { return expiration; }
    public Long getRefreshExpirationMs() { return refreshExpiration; }

    public Boolean canBeRefreshed(String token) {
        return (!isTokenExpired(token) || isRefreshToken(token));
    }

    public String refreshToken(String token) {
        try {
            final Claims claims = extractAllClaims(token);
            Map<String, Object> newClaims = new HashMap<>(claims);
            newClaims.remove("type");
            return Jwts.builder()
                    .claims(newClaims)
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + expiration))
                    .signWith(getSigningKey())
                    .compact();
        } catch (ExpiredJwtException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token has expired and cannot be refreshed", e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unable to refresh token", e);
        }
    }

    public Date getIssuedAtDateFromToken(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    public Long getRemainingValidityMs(String token) {
        Date exp = extractExpiration(token);
        return exp.getTime() - System.currentTimeMillis();
    }

    public Boolean isTokenValid(String token, String username) {
        final String tokenUsername = extractUsername(token);
        return (tokenUsername.equals(username) && !isTokenExpired(token));
    }

    public String generateTokenWithClaims(Map<String, Object> claims, String subject) {
        claims.put("created", new Date());
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }
}
