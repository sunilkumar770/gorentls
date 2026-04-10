package com.rentit.dto;

import lombok.Data;

@Data
public class KYCSubmissionRequest {
    private String documentType; // Aadhaar, PAN, Passport
    private String idNumber;
    private String documentUrl;
}
