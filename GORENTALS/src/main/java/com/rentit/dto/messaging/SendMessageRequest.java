package com.rentit.dto.messaging;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Message content is required")
    @Size(min = 1, max = 2000, message = "Message must be 1–2000 characters")
    private String content;
}
