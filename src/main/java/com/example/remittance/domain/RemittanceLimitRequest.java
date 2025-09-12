package com.example.remittance.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "remittance_limit_request")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RemittanceLimitRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Transient
    private String userName;
    
    @Column(name = "daily_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimit;
    
    @Column(name = "monthly_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyLimit;
    
    @Column(name = "single_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal singleLimit;
    
    @Column(name = "reason", nullable = false, columnDefinition = "text")
    private String reason;
    
    @Column(name = "income_file_id")
    private Long incomeFileId;
    
    @Column(name = "bankbook_file_id")
    private Long bankbookFileId;
    
    @Column(name = "business_file_id")
    private Long businessFileId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequestStatus status = RequestStatus.PENDING;
    
    @Column(name = "admin_id")
    private Long adminId;
    
    @Column(name = "admin_comment", columnDefinition = "text")
    private String adminComment;
    
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum RequestStatus {
        PENDING, APPROVED, REJECTED
    }
} 