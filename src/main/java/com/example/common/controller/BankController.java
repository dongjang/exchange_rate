package com.example.common.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.common.domain.UserBankAccount;
import com.example.common.dto.BankResponse;
import com.example.common.dto.BanksInfoResponse;
import com.example.common.dto.UserBankAccountResponse;
import com.example.common.repository.BankRepository;
import com.example.common.service.BankService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/banks")
@RequiredArgsConstructor
public class BankController {
    
    private final BankRepository bankRepository;
    private final BankService bankService;

    @GetMapping("/currency_bank_info")
    public ResponseEntity<List<BankResponse>> getBanksByCurrency(@RequestParam String currencyCode) {
        List<BanksInfoResponse> banks = bankRepository.findBanksByCurrencyCode(currencyCode);
        List<BankResponse> responses = banks.stream()
                .map(bank -> BankResponse.builder()
                        .id(null) // BanksInfoResponse에는 id가 없음
                        .name(bank.getName())
                        .bankCode(bank.getBankCode())
                        .currencyCode(currencyCode) // 파라미터로 받은 currencyCode 사용
                        .countryName(null) // BanksInfoResponse에는 countryName이 없음
                        .codeName(null) // BanksInfoResponse에는 codeName이 없음
                        .build())
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    
    @PostMapping
    public ResponseEntity<UserBankAccountResponse> saveOrUpdate(@RequestBody UserBankAccount account) {
        UserBankAccount saved = bankService.saveOrUpdate(account);
        return ResponseEntity.ok(bankService.toResponse(saved));
    }

    @GetMapping
    public ResponseEntity<UserBankAccountResponse> getByUserId() {
        UserBankAccount account = bankService.getByUserId();
        if (account == null) return ResponseEntity.ok(null);
        return ResponseEntity.ok(bankService.toResponse(account));
    }
} 