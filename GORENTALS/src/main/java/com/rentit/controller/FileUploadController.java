package com.rentit.controller;

import com.rentit.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/single")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadSingle(@RequestParam("file") MultipartFile file, 
                                        @RequestParam(value = "folder", defaultValue = "general") String folder) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            String url = cloudinaryService.uploadFile(file, folder);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            log.error("Upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @PostMapping("/multiple")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadMultiple(@RequestParam("files") MultipartFile[] files,
                                          @RequestParam(value = "folder", defaultValue = "listings") String folder) {
        List<String> urls = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    urls.add(cloudinaryService.uploadFile(file, folder));
                }
            }
            return ResponseEntity.ok(Map.of("urls", urls));
        } catch (IOException e) {
            log.error("Multiple upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Some uploads failed: " + e.getMessage());
        }
    }
}
