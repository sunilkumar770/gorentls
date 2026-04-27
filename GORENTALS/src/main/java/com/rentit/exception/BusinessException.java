package com.rentit.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for all application-layer business rule violations.
 *
 * Rules:
 *   - Use this for conditions that are EXPECTED (bad input, invalid state,
 *     resource not found). These map to 4xx HTTP responses.
 *   - Never use RuntimeException directly in service layer.
 *   - Never use this for infrastructure failures (DB down, network timeout) —
 *     those should propagate as unchecked exceptions and map to 500.
 *
 * Usage:
 *   throw new BusinessException("Booking not found", HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND");
 *   throw new BusinessException("Amount exceeds escrow balance", HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_ESCROW");
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus httpStatus;
    private final String     errorCode;

    // ── Constructors ─────────────────────────────────────────────────────────

    /**
     * Full constructor.
     *
     * @param message    human-readable message (shown in error response body)
     * @param httpStatus HTTP status code to return to the client
     * @param errorCode  machine-readable code for frontend error handling
     *                   (e.g. "BOOKING_NOT_FOUND", "ESCROW_INSUFFICIENT")
     */
    public BusinessException(String message, HttpStatus httpStatus, String errorCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.errorCode  = errorCode;
    }

    /** Constructor used when the HTTP status must be explicitly specified
     *  (e.g. BAD_REQUEST for signature failures, not 422). */
    public BusinessException(String message, String errorCode, HttpStatus httpStatus) {
        super(message);
        this.errorCode  = errorCode;
        this.httpStatus = httpStatus;
    }

    /**
     * Convenience constructor — defaults to 422 UNPROCESSABLE_ENTITY.
     * Use when business logic rejects the request (not a 404, not a 409).
     */
    public BusinessException(String message, String errorCode) {
        this(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode);
    }

    /**
     * Convenience constructor — defaults to 400 BAD_REQUEST.
     * Use for simple validation failures that don't have a named error code.
     */
    public BusinessException(String message) {
        this(message, HttpStatus.BAD_REQUEST, "BUSINESS_RULE_VIOLATION");
    }

    /**
     * Wrap a cause — useful when catching a lower-level exception
     * and re-throwing as a business error.
     */
    public BusinessException(String message, HttpStatus httpStatus,
                              String errorCode, Throwable cause) {
        super(message, cause);
        this.httpStatus = httpStatus;
        this.errorCode  = errorCode;
    }

    // ── Static factories (preferred over constructors in service layer) ───────

    public static BusinessException notFound(String resource, Object id) {
        return new BusinessException(
            resource + " not found: " + id,
            HttpStatus.NOT_FOUND,
            resource.toUpperCase().replace(" ", "_") + "_NOT_FOUND"
        );
    }

    public static BusinessException conflict(String message, String errorCode) {
        return new BusinessException(message, HttpStatus.CONFLICT, errorCode);
    }

    public static BusinessException forbidden(String message) {
        return new BusinessException(message, HttpStatus.FORBIDDEN, "ACCESS_DENIED");
    }

    public static BusinessException unprocessable(String message, String errorCode) {
        return new BusinessException(message, HttpStatus.UNPROCESSABLE_ENTITY, errorCode);
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    public HttpStatus getHttpStatus() { return httpStatus; }
    public String     getErrorCode()  { return errorCode; }
}
