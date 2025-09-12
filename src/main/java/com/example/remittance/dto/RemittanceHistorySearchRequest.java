package com.example.remittance.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RemittanceHistorySearchRequest {
    private String userName;
    private String receiverName;
    private String currency;
    private String status;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String startDate;
    private String endDate;
    private String sortOrder;
    private int page;
    private int size;
} 