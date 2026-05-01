package com.rentit;

import com.rentit.dto.LoginRequest;
import com.rentit.dto.RegisterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for DTO validation logic without loading Spring context.
 */
public class InputValidationTest {

    private static Validator validator;

    @BeforeAll
    public static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    public void testInvalidEmailValidation() {
        LoginRequest loginRequest = new LoginRequest("invalid-email", "password123");
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(loginRequest);
        
        assertFalse(violations.isEmpty(), "Should have validation errors for invalid email");
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("Email must be valid")));
    }

    @Test
    public void testValidLoginRequest() {
        LoginRequest loginRequest = new LoginRequest("test@example.com", "password123");
        Set<ConstraintViolation<LoginRequest>> violations = validator.validate(loginRequest);
        
        assertTrue(violations.isEmpty(), "Valid login should have no violations");
    }

    @Test
    public void testWeakPasswordValidation() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPassword("weak");
        registerRequest.setPhoneNumber("+1234567890");
        
        Set<ConstraintViolation<RegisterRequest>> violations = validator.validate(registerRequest);
        
        assertFalse(violations.isEmpty(), "Weak password should fail validation");
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("password")));
    }
}
