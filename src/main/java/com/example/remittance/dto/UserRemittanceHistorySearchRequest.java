package com.example.remittance.dto;

import lombok.Data;

@Data
public class UserRemittanceHistorySearchRequest {
    private Long userId;
    private String recipient;
    private String currency;
    private String status;
    private String minAmount;
    private String maxAmount;
    private String startDate;
    private String endDate;
    private String sortOrder;
    private int page;
    private int size;
} 