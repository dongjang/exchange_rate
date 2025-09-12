package com.example.remittance.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "remittance_limit")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RemittanceLimit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "daily_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimit;
    
    @Column(name = "monthly_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyLimit;
    
    @Column(name = "single_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal singleLimit;
    
    @Column(name = "request_reason", length = 500)
    private String requestReason;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequestStatus status;
    
    @Column(name = "admin_comment", length = 500)
    private String adminComment;
    
    @Column(name = "approved_by", length = 255)
    private String approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum RequestStatus {
        PENDING, APPROVED, REJECTED
    }
} 