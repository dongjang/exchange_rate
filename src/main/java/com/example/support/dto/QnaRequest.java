package com.example.support.dto;

import org.springframework.web.multipart.MultipartFile;

import lombok.Data;

@Data
public class QnaRequest {
    private String title;
    private String content;
    private MultipartFile file;
    private boolean removeExistingFile;
}
