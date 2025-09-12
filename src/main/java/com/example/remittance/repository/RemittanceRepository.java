package com.example.remittance.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.remittance.domain.Remittance;

public interface RemittanceRepository extends JpaRepository<Remittance, Long>, JpaSpecificationExecutor<Remittance> {
    
    @Query("SELECT " +
           "r.id, " +
           "sb.name as senderBank, " +
           "r.senderAccount, " +
           "r.currency, " +
           "r.receiverBank, " +
           "r.receiverAccount, " +
           "rb.name as receiverBank, " +
           "r.receiverName, " +
           "r.amount, " +
           "r.exchangeRate, " +
           "r.convertedAmount, " +
           "r.status, " +
           "r.createdAt " +
           "FROM Remittance r " +
           "LEFT JOIN Bank sb ON r.senderBank = sb.bankCode " +
           "LEFT JOIN Bank rb ON r.receiverBank = rb.bankCode " +
           "WHERE r.userId = :userId " +
           "AND (:recipient IS NULL OR r.receiverName LIKE %:recipient%) " +
           "AND (:currency IS NULL OR r.currency = :currency) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:minAmount IS NULL OR r.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR r.amount <= :maxAmount) " +
           "AND (:startDate IS NULL OR r.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR r.createdAt <= :endDate) " +
           "ORDER BY " +
           "CASE WHEN :sortOrder = 'latest' THEN r.createdAt END DESC, " +
           "CASE WHEN :sortOrder = 'oldest' THEN r.createdAt END ASC, " +
           "CASE WHEN :sortOrder = 'amount_desc' THEN r.amount END DESC, " +
           "CASE WHEN :sortOrder = 'amount_asc' THEN r.amount END ASC")
    List<Object[]> findRemittanceHistoryWithBankNames(
        @Param("userId") Long userId,
        @Param("recipient") String recipient,
        @Param("currency") String currency,
        @Param("status") String status,
        @Param("minAmount") BigDecimal minAmount,
        @Param("maxAmount") BigDecimal maxAmount,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("sortOrder") String sortOrder
    );

    @Query("SELECT COUNT(r) " +
           "FROM Remittance r " +
           "WHERE r.userId = :userId " +
           "AND (:recipient IS NULL OR r.receiverName LIKE %:recipient%) " +
           "AND (:currency IS NULL OR r.currency = :currency) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:minAmount IS NULL OR r.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR r.amount <= :maxAmount) " +
           "AND (:startDate IS NULL OR r.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR r.createdAt <= :endDate)")
    Long countRemittanceHistory(
        @Param("userId") Long userId,
        @Param("recipient") String recipient,
        @Param("currency") String currency,
        @Param("status") String status,
        @Param("minAmount") BigDecimal minAmount,
        @Param("maxAmount") BigDecimal maxAmount,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
} 