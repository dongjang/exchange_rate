package com.example.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBankAccountResponse {
    private Long id;
    private Long userId;
    private String bankCode;
    private String accountNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 