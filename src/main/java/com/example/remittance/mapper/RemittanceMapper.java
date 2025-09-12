package com.example.remittance.mapper;

import java.math.BigDecimal;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.remittance.dto.UserLimitsResponse;

@Mapper
public interface RemittanceMapper {
        
    
    /**
     * 일일 한도 조회
     */
    BigDecimal getDailyLimit(@Param("userId") Long userId);
    
    /**
     * 월 한도 조회
     */
    BigDecimal getMonthlyLimit(@Param("userId") Long userId);
    
    /**
     * 사용자별 한도 조회
     */
    UserLimitsResponse getUserLimits(@Param("userId") Long userId);
} 