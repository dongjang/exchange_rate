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
public class RemittanceDetailResponse {
    private Long id;
    private Long userId;
    
    // 송금 기본 정보
    private String senderBank;
    private String senderAccount;
    private String receiverBank;
    private String receiverAccount;
    private String receiverName;
    private String receiverCountry;
    private BigDecimal amount;
    private String currency;
    private String status;
    private BigDecimal exchangeRate;
    private BigDecimal convertedAmount;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 은행 정보 (조인 결과)
    private String senderBankName;
    private String receiverBankName;
}
