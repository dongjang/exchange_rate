package com.example.remittance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLimitsResponse {
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private BigDecimal singleLimit;
    private String limitType;
}
