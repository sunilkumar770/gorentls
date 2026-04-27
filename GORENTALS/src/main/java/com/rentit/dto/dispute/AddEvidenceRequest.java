package com.rentit.dto.dispute;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AddEvidenceRequest(
    @NotEmpty(message = "At least one evidence URL is required")
    @Size(max = 5, message = "Maximum 5 additional evidence files per request")
    List<String> evidenceUrls
) {}
