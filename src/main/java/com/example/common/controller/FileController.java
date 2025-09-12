package com.example.common.controller;

import com.example.common.domain.File;
import com.example.common.service.FileService;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {
    
    private final FileService fileService;
    
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }
    
    // 파일 정보 조회
    @GetMapping("/{fileId}/info")
    public ResponseEntity<File> getFileInfo(@PathVariable Long fileId) {
        File file = fileService.getFileById(fileId);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(file);
    }
    
    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> getFile(@PathVariable Long fileId) {
        try {
            File file = fileService.getFileById(fileId);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = fileService.loadFileAsResource(fileId);
            if (resource == null) {
                return ResponseEntity.notFound().build();
            }
            
            String contentType = file.getFileType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/octet-stream";
            }
            
            // 한글 파일명 문제를 피하기 위해 ASCII 파일명만 사용
            String safeFilename = "file." + contentType.split("/")[1];
            
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename + "\"");
            headers.setContentType(MediaType.parseMediaType(contentType));
            
            // PDF 파일의 경우 추가 헤더 설정
            if (contentType.equals("application/pdf")) {
                try {
                    Path filePath = Paths.get(file.getFilePath());
                    long contentLength = Files.size(filePath);
                    headers.setContentLength(contentLength);
                    
                    // PDF 스트리밍을 위한 추가 헤더
                    headers.set("Accept-Ranges", "bytes");
                    headers.set("Cache-Control", "public, max-age=3600");
                    headers.set("X-Content-Type-Options", "nosniff");
                } catch (IOException e) {
                    // 무시
                }
            }
            
            // 이미지 파일의 경우 추가 헤더 설정
            if (contentType.startsWith("image/")) {
                headers.set("Cache-Control", "public, max-age=3600");
                headers.set("X-Content-Type-Options", "nosniff");
                headers.set("Access-Control-Allow-Origin", "*");
                headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
                headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            }
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        try {
            File file = fileService.getFileById(fileId);
            if (file == null) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = fileService.loadFileAsResource(fileId);
            if (resource == null) {
                return ResponseEntity.notFound().build();
            }
            
            // 한글 파일명을 위한 URL 인코딩
            String encodedFilename = URLEncoder.encode(file.getOriginalName(), StandardCharsets.UTF_8.toString());
            
            // Content-Disposition 헤더를 여러 형식으로 설정
            String contentDisposition = String.format(
                "attachment; filename=\"%s\"; filename*=UTF-8''%s",
                file.getOriginalName(),
                encodedFilename
            );
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .contentType(MediaType.parseMediaType(file.getFileType()))
                .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}