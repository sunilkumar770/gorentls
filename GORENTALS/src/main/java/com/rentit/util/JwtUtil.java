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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

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

    @jakarta.annotation.PostConstruct
    public void validateSecret() {
        if (secret == null || secret.isBlank() || secret.contains("your-secret-key")) {
            logger.error("FATAL: JWT_SECRET is not set or using default value!");
            throw new IllegalStateException("JWT_SECRET env var is not set. Refusing to start.");
        }
    }

    /**
     * Extract username from token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extract expiration date from token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extract specific claim from token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from token
     */
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            logger.error("JWT token expired: {}", e.getMessage());
            throw e;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
            throw e;
        } catch (SecurityException e) {
            logger.error("Invalid JWT signature/security: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error parsing JWT token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Get signing key
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Check if token is expired
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Generate token for user
     */
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("created", new Date());
        return createToken(claims, username);
    }

    /**
     * Generate refresh token
     */
    public String generateRefreshToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("created", new Date());
        return createRefreshToken(claims, username);
    }

    /**
     * Create access token
     */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Create refresh token (longer expiry)
     */
    private String createRefreshToken(Map<String, Object> claims, String subject) {
        long refreshExpiration = expiration * 2; // 2x the access token expiry
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validate token
     */
    public Boolean validateToken(String token, String username) {
        try {
            final String extractedUsername = extractUsername(token);
            return (extractedUsername.equals(username) && !isTokenExpired(token));
        } catch (Exception e) {
            logger.error("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Extract role from token
     */
    public String extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return (String) claims.get("role");
        } catch (Exception e) {
            logger.error("Failed to extract role from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Check if token is refresh token
     */
    public Boolean isRefreshToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String type = (String) claims.get("type");
            return "refresh".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get token expiration in milliseconds
     */
    public Long getExpirationMs() {
        return expiration;
    }

    /**
     * Check if token can be refreshed
     */
    public Boolean canBeRefreshed(String token) {
        return (!isTokenExpired(token) || isRefreshToken(token));
    }

    /**
     * Refresh token - create new token from old one
     */
    public String refreshToken(String token) {
        try {
            final Claims claims = extractAllClaims(token);
            Map<String, Object> newClaims = new HashMap<>(claims);
            newClaims.remove("type"); // Remove refresh type for new access token
            
            return Jwts.builder()
                    .claims(newClaims)
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + expiration))
                    .signWith(getSigningKey())
                    .compact();
        } catch (Exception e) {
            logger.error("Token refresh failed: {}", e.getMessage());
            throw new RuntimeException("Unable to refresh token", e);
        }
    }

    /**
     * Get token issued at date
     */
    public Date getIssuedAtDateFromToken(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    /**
     * Get remaining validity in milliseconds
     */
    public Long getRemainingValidityMs(String token) {
        Date expiration = extractExpiration(token);
        Date now = new Date();
        return expiration.getTime() - now.getTime();
    }

    /**
     * Check if token is valid for user
     */
    public Boolean isTokenValid(String token, String username) {
        final String tokenUsername = extractUsername(token);
        return (tokenUsername.equals(username) && !isTokenExpired(token));
    }

    /**
     * Generate token with custom claims
     */
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
