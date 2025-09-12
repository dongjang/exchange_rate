package com.example.remittance.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.remittance.domain.RemittanceLimitRequest;
import com.example.remittance.dto.RemittanceLimitRequestResponse;

@Mapper
public interface RemittanceLimitRequestMapper {
           
    RemittanceLimitRequestResponse selectRemittanceLimitRequestById(@Param("id") Long id);
    
    int insertRemittanceLimitRequest(RemittanceLimitRequest request);
    
    int updateRemittanceLimitRequest(RemittanceLimitRequest request);
    
    int updateRemittanceLimitRequestStatus(@Param("id") Long id,
                                         @Param("status") String status,
                                         @Param("adminId") Long adminId,
                                         @Param("adminComment") String adminComment);
    
    int clearFileIds(@Param("id") Long id);
    
    int hasUserRemittanceLimit(@Param("userId") Long userId);
} 