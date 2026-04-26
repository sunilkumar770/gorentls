package com.rentit.config;

import com.rentit.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centralised exception → HTTP mapping.
 *
 * Priority order (most-specific first):
 *   ResponseStatusException  → 4xx/5xx as declared at the throw site
 *   AccessDeniedException    → 403
 *   AuthenticationException  → 401
 *   NoHandlerFoundException  → 404
 *   MethodArgumentNotValidException → 400 with field map
 *   IllegalArgumentException → 400
 *   IllegalStateException    → 409 (booking state conflicts)
 *   Exception (catch-all)    → 500 (logged at ERROR level)
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── BUG-23 FIX: ResponseStatusException must be handled FIRST ───────────
    // Without this, every ResponseStatusException (404, 409, 400, …) thrown
    // inside services would fall through to the catch-all 500 handler.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatus(ResponseStatusException ex) {
        log.warn("ResponseStatusException [{}]: {}", ex.getStatusCode(), ex.getReason());
        return ResponseEntity.status(ex.getStatusCode())
            .body(Map.of(
                "error",   ex.getStatusCode().toString(),
                "message", ex.getReason() != null ? ex.getReason() : ex.getMessage()
            ));
    }

    // ── 404 — unmapped route ─────────────────────────────────────────────────
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(NoHandlerFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of(
                "error",   "Not Found",
                "message", "No endpoint: " + ex.getHttpMethod() + " " + ex.getRequestURL()
            ));
    }

    // ── 403 — access denied ──────────────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "Forbidden", "message", "Access denied."));
    }

    // ── 401 — authentication failure ─────────────────────────────────────────
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuth(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Unauthorized", "message", ex.getMessage()));
    }

    // ── 400 — @Valid field validation failures ───────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult()
            .getFieldErrors().stream()
            .collect(Collectors.toMap(
                fe -> fe.getField(),
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                (a, b) -> a   // keep first error per field
            ));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "Validation Failed", "fields", fieldErrors));
    }

    // ── 400 — bad enum / bad argument ────────────────────────────────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArg(IllegalArgumentException ex) {
        log.debug("IllegalArgumentException: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "Bad Request", "message", ex.getMessage()));
    }

    // ── 409 — invalid state machine transition ────────────────────────────────
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalState(IllegalStateException ex) {
        log.debug("IllegalStateException: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("error", "Conflict", "message", ex.getMessage()));
    }

    // ── 500 — catch-all — LAST resort ────────────────────────────────────────
    // BUG-23 FIX: use log.error (structured) instead of ex.printStackTrace()
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAll(Exception ex) {
        log.error("Unhandled exception [{}]: {}", ex.getClass().getSimpleName(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of(
                "error",   "Internal Server Error",
                "message", "An unexpected error occurred. Please try again later."
            ));
    }
}
