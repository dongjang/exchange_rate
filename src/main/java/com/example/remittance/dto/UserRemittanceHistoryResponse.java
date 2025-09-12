package com.example.remittance.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserRemittanceHistoryResponse {
    private List<RemittanceHistoryDto> content;
    private int page;
    private int size;
    private Long totalElements;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
} 