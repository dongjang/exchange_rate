package com.example.remittance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.remittance.domain.RemittanceLimitRequest;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RemittanceLimitRequestWithFilesResponse {
    
    // RemittanceLimitRequest 정보
    private Long id;
    private Long userId;
    private String userName;
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private BigDecimal singleLimit;
    private String reason;
    private RemittanceLimitRequest.RequestStatus status;
    private Long adminId;
    private String adminComment;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 파일 정보
    private FileInfo incomeFile;
    private FileInfo bankbookFile;
    private FileInfo businessFile;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileInfo {
        private Long id;
        private String originalName;
        private Long fileSize;
        private String fileType;
    }
} 