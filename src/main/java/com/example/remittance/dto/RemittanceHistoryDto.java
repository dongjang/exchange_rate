package com.example.remittance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.example.remittance.domain.Remittance;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RemittanceHistoryDto {
    private Long id;
    private String senderBank;
    private String senderAccount;
    private String receiverBank;
    private String receiverAccount;
    private String receiverName;
    private String receiverCountry;
    private BigDecimal amount;
    private String currency;
    private BigDecimal exchangeRate;
    private BigDecimal convertedAmount;
    private String status;
    private LocalDateTime createdAt;
    
    public static RemittanceHistoryDto from(Remittance remittance) {
        return RemittanceHistoryDto.builder()
                .id(remittance.getId())
                .senderBank(remittance.getSenderBank())
                .senderAccount(remittance.getSenderAccount())
                .receiverBank(remittance.getReceiverBank())
                .receiverAccount(remittance.getReceiverAccount())
                .receiverName(remittance.getReceiverName())
                .receiverCountry(remittance.getReceiverCountry())
                .amount(remittance.getAmount())
                .currency(remittance.getCurrency())
                .exchangeRate(remittance.getExchangeRate())
                .convertedAmount(remittance.getConvertedAmount())
                .status(remittance.getStatus())
                .createdAt(remittance.getCreatedAt())
                .build();
    }
    
    public String getFormattedCreatedAt() {
        if (createdAt == null) return "";
        return createdAt.format(DateTimeFormatter.ofPattern("yy.MM.dd HH:mm"));
    }
} 