package com.rentit.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/errors")
public class MonitoringController {

    @PostMapping
    public ResponseEntity<Void> logFrontendError(@RequestBody Map<String, Object> errorData) {
        // Log the frontend error as a structured log
        // This will be picked up by the JSON logstash encoder in prod
        log.error("[FRONTEND_ERROR] msg=\"{}\" url=\"{}\" digest=\"{}\" stack=\"{}\"",
                errorData.get("message"),
                errorData.get("url"),
                errorData.get("digest"),
                errorData.get("stack")
        );
        return ResponseEntity.ok().build();
    }
}
