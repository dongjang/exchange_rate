package com.example.remittance.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemittanceLimitCheckResponse {
    private boolean success;
    private String message;
    private String errorType; // "LIMIT_EXCEEDED"
    private String exceededType; // "DAILY", "MONTHLY", "BOTH"
    private BigDecimal requestedAmount;
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private BigDecimal dailyExceededAmount;
    private BigDecimal monthlyExceededAmount;
}
