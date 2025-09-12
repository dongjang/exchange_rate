package com.example.remittance.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.remittance.domain.RemittanceLimitRequest;

@Repository
public interface RemittanceLimitRequestRepository extends JpaRepository<RemittanceLimitRequest, Long> {
    
    List<RemittanceLimitRequest> findByUserId(Long userId);
    
} 