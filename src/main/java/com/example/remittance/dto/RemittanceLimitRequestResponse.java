package com.example.remittance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemittanceLimitRequestResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String currentLimit;
    private String requestedLimit;
    private Long newDailyLimit;
    private Long newMonthlyLimit;
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private BigDecimal singleLimit;
    private String reason;
    private String status;
    private Long incomeFileId;
    private String incomeFileName;
    private Integer incomeFileSize;
    private String incomeFileType;
    private Long bankbookFileId;
    private String bankbookFileName;
    private Integer bankbookFileSize;
    private String bankbookFileType;
    private Long businessFileId;
    private String businessFileName;
    private Integer businessFileSize;
    private String businessFileType;
    private Long adminId;
    private String adminComment;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 