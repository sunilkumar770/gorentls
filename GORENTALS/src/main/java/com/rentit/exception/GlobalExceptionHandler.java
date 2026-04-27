package com.rentit.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralised exception → HTTP response mapper.
 *
 * Uses RFC 7807 ProblemDetail (built into Spring 6 / Spring Boot 3).
 * Every error response has a consistent shape:
 *
 * {
 *   "type":     "https://gorentals.in/errors/BOOKING_NOT_FOUND",
 *   "title":    "Not Found",
 *   "status":   404,
 *   "detail":   "Booking not found: 3fa85f64-...",
 *   "instance": "/api/bookings/3fa85f64-...",
 *   "errorCode": "BOOKING_NOT_FOUND",
 *   "timestamp": "2026-04-27T12:00:00Z"
 * }
 *
 * RULES:
 *   - 4xx errors: log at WARN with request details.
 *   - 5xx errors: log at ERROR with full stack trace.
 *   - Never expose internal stack traces in responses.
 *   - Validation errors include a `violations` map of field → message.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final String ERROR_BASE_URI = "https://gorentals.in/errors/";

    // ── BusinessException (and all subclasses) ────────────────────────────────

    /**
     * Handles all application business rule violations.
     * BusinessException subclass InvalidStateTransitionException is also caught here.
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusinessException(
        BusinessException ex,
        HttpServletRequest request
    ) {
        log.warn("Business error [{}] {}: {} — path={}",
            ex.getHttpStatus().value(), ex.getErrorCode(),
            ex.getMessage(), request.getRequestURI());

        ProblemDetail problem = buildProblem(
            ex.getHttpStatus(),
            ex.getErrorCode(),
            ex.getMessage(),
            request.getRequestURI()
        );
        return ResponseEntity.status(ex.getHttpStatus()).body(problem);
    }

    // ── Bean validation (@Valid) ───────────────────────────────────────────────

    /**
     * Handles @Valid / @Validated failures on request bodies and params.
     * Returns 400 with a `violations` map of field → error message.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
        MethodArgumentNotValidException ex,
        HttpServletRequest request
    ) {
        Map<String, String> violations = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            violations.put(fe.getField(), fe.getDefaultMessage());
        }

        log.warn("Validation failed: {} violations — path={}", violations.size(),
            request.getRequestURI());

        ProblemDetail problem = buildProblem(
            HttpStatus.BAD_REQUEST,
            "VALIDATION_FAILED",
            "Request validation failed. See 'violations' for details.",
            request.getRequestURI()
        );
        problem.setProperty("violations", violations);
        return ResponseEntity.badRequest().body(problem);
    }

    // ── Malformed JSON body ────────────────────────────────────────────────────

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadableBody(
        HttpMessageNotReadableException ex,
        HttpServletRequest request
    ) {
        log.warn("Malformed request body — path={}: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = buildProblem(
            HttpStatus.BAD_REQUEST,
            "MALFORMED_REQUEST_BODY",
            "Request body could not be parsed. Verify JSON syntax and field types.",
            request.getRequestURI()
        );
        return ResponseEntity.badRequest().body(problem);
    }

    // ── Missing / wrong-type request params ───────────────────────────────────

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ProblemDetail> handleMissingParam(
        MissingServletRequestParameterException ex,
        HttpServletRequest request
    ) {
        log.warn("Missing parameter '{}' — path={}", ex.getParameterName(), request.getRequestURI());

        ProblemDetail problem = buildProblem(
            HttpStatus.BAD_REQUEST,
            "MISSING_PARAMETER",
            "Required parameter '" + ex.getParameterName() + "' is missing.",
            request.getRequestURI()
        );
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ProblemDetail> handleTypeMismatch(
        MethodArgumentTypeMismatchException ex,
        HttpServletRequest request
    ) {
        String expected = ex.getRequiredType() != null
            ? ex.getRequiredType().getSimpleName()
            : "unknown";

        log.warn("Type mismatch for param '{}': got '{}', expected {} — path={}",
            ex.getName(), ex.getValue(), expected, request.getRequestURI());

        ProblemDetail problem = buildProblem(
            HttpStatus.BAD_REQUEST,
            "PARAMETER_TYPE_MISMATCH",
            String.format("Parameter '%s' must be of type %s, got: '%s'",
                ex.getName(), expected, ex.getValue()),
            request.getRequestURI()
        );
        return ResponseEntity.badRequest().body(problem);
    }

    // ── Spring Security ───────────────────────────────────────────────────────

    /**
     * 401 — not authenticated.
     * Thrown by Spring Security when no valid token is present.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(
        AuthenticationException ex,
        HttpServletRequest request
    ) {
        log.warn("Authentication failure — path={}: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = buildProblem(
            HttpStatus.UNAUTHORIZED,
            "AUTHENTICATION_REQUIRED",
            "Authentication required. Provide a valid Bearer token.",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
    }

    /**
     * 403 — authenticated but not authorized.
     * Thrown by @PreAuthorize or Spring Security access decisions.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(
        AccessDeniedException ex,
        HttpServletRequest request
    ) {
        log.warn("Access denied — path={} user={}",
            request.getRequestURI(), request.getUserPrincipal());

        ProblemDetail problem = buildProblem(
            HttpStatus.FORBIDDEN,
            "ACCESS_DENIED",
            "You do not have permission to perform this action.",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
    }

    // ── Illegal argument (programming errors surfacing as 400) ────────────────

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ProblemDetail> handleIllegalArgument(
        IllegalArgumentException ex,
        HttpServletRequest request
    ) {
        log.warn("IllegalArgument — path={}: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = buildProblem(
            HttpStatus.BAD_REQUEST,
            "INVALID_ARGUMENT",
            ex.getMessage(),
            request.getRequestURI()
        );
        return ResponseEntity.badRequest().body(problem);
    }

    // ── Illegal state (internal state machine violation surfacing as 409) ─────

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ProblemDetail> handleIllegalState(
        IllegalStateException ex,
        HttpServletRequest request
    ) {
        log.error("IllegalState — path={}: {}", request.getRequestURI(), ex.getMessage(), ex);

        ProblemDetail problem = buildProblem(
            HttpStatus.CONFLICT,
            "ILLEGAL_STATE",
            ex.getMessage(),
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    // ── Catch-all 500 ─────────────────────────────────────────────────────────

    /**
     * Last-resort handler — catches anything not matched above.
     * Logs the full stack trace (never exposed to client).
     * Returns a safe 500 with no internal detail.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(
        Exception ex,
        HttpServletRequest request
    ) {
        log.error("Unhandled exception — path={} method={}",
            request.getRequestURI(), request.getMethod(), ex);

        ProblemDetail problem = buildProblem(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            "An unexpected error occurred. Our team has been notified.",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    private ProblemDetail buildProblem(
        HttpStatus status,
        String errorCode,
        String detail,
        String instance
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create(ERROR_BASE_URI + errorCode));
        problem.setTitle(status.getReasonPhrase());
        problem.setInstance(URI.create(instance));
        problem.setProperty("errorCode",  errorCode);
        problem.setProperty("timestamp",  Instant.now().toString());
        return problem;
    }
}
