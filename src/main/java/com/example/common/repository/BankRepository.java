package com.example.common.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.common.domain.Bank;
import com.example.common.dto.BanksInfoResponse;



public interface BankRepository extends JpaRepository<Bank, Long> {
    @Query("SELECT new com.example.common.dto.BanksInfoResponse(b.bankCode, b.name) FROM Bank b WHERE b.currencyCode = :currencyCode")
    List<BanksInfoResponse> findBanksByCurrencyCode(@Param("currencyCode") String currencyCode);
} 