package com.example.repository;

import com.example.domain.Remittance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
           "r.status, " +
           "r.createdAt " +
           "FROM remittance r " +
           "LEFT JOIN bank sb ON r.senderBank = sb.bankCode " +
           "LEFT JOIN bank rb ON r.receiverBank = rb.bankCode " +
           "WHERE r.userId = :userId " +
           "AND (:recipient IS NULL OR r.receiverName LIKE %:recipient%) " +
           "AND (:currency IS NULL OR r.currency = :currency) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:minAmount IS NULL OR r.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR r.amount <= :maxAmount) " +
           "AND (:startDate IS NULL OR r.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR r.createdAt <= :endDate) " +
           "ORDER BY r.createdAt DESC")
    List<Object[]> findRemittanceHistoryWithBankNames(
        @Param("userId") Long userId,
        @Param("recipient") String recipient,
        @Param("currency") String currency,
        @Param("status") String status,
        @Param("minAmount") BigDecimal minAmount,
        @Param("maxAmount") BigDecimal maxAmount,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

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
           "r.status, " +
           "r.createdAt " +
           "FROM remittance r " +
           "LEFT JOIN bank sb ON r.senderBank = sb.bankCode " +
           "LEFT JOIN bank rb ON r.receiverBank = rb.bankCode " +
           "WHERE r.userId = :userId " +
           "AND (:recipient IS NULL OR r.receiverName LIKE %:recipient%) " +
           "AND (:currency IS NULL OR r.currency = :currency) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:minAmount IS NULL OR r.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR r.amount <= :maxAmount) " +
           "AND (:startDate IS NULL OR r.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR r.createdAt <= :endDate) " +
           "ORDER BY r.createdAt DESC")
    Page<Object[]> findRemittanceHistoryWithBankNamesPaged(
        @Param("userId") Long userId,
        @Param("recipient") String recipient,
        @Param("currency") String currency,
        @Param("status") String status,
        @Param("minAmount") BigDecimal minAmount,
        @Param("maxAmount") BigDecimal maxAmount,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    @Query("SELECT COUNT(r) " +
           "FROM remittance r " +
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