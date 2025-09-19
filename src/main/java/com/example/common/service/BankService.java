package com.example.common.service;

import com.example.common.domain.UserBankAccount;
import com.example.common.dto.UserBankAccountResponse;
import com.example.common.repository.UserBankAccountRepository;
import com.example.context.SessionContext;

import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BankService {
    private final UserBankAccountRepository userBankAccountRepository;
    //User 전용 service
    public UserBankAccount saveOrUpdate(UserBankAccount account) {
        Long userId = SessionContext.getCurrentUserId();

        UserBankAccount existing = userBankAccountRepository.findByUserId(userId);

        if (existing != null) {
            existing.setBankCode(account.getBankCode());
            existing.setAccountNumber(account.getAccountNumber());
            existing.setUpdatedAt(LocalDateTime.now());
            return userBankAccountRepository.save(existing);
        } 
        else {
            System.out.println("account: " + account);
            account.setCreatedAt(LocalDateTime.now());
            account.setUserId(userId);
            return userBankAccountRepository.save(account);
        }
    }

    //User 내 은행/계좌 정보 조회
    public UserBankAccount getByUserId() {
        Long userId = SessionContext.getCurrentUserId();
        return userBankAccountRepository.findByUserId(userId);
    }

    public static UserBankAccountResponse toResponse(UserBankAccount entity) {
        if (entity == null) return null;
        return UserBankAccountResponse.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .bankCode(entity.getBankCode())
                .accountNumber(entity.getAccountNumber())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
} 