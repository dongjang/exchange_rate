package com.example.remittance.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RemittanceHistoryResponse {
    private String senderBank;
    private String userName;
    private String senderAccount;
    private String currency;
    private String receiverBank;
    private String receiverAccount;
    private String receiverBankName;
    private String receiverName;
    private BigDecimal amount;
    private BigDecimal exchangeRate;
    private BigDecimal convertedAmount;
    private String status;
    private LocalDateTime createdAt;
} 