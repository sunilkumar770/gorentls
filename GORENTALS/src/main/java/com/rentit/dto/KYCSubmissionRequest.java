package com.rentit.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Data
public class KYCSubmissionRequest {
    @NotBlank(message = "Document type is required")
    @Pattern(regexp = "^(Aadhaar|PAN|Passport)$", message = "Invalid document type. Allowed values: Aadhaar, PAN, Passport")
    private String documentType; // Aadhaar, PAN, Passport
    
    @NotBlank(message = "ID number is required")
    private String idNumber;
    
    @NotBlank(message = "Document URL is required")
    private String documentUrl;
}
