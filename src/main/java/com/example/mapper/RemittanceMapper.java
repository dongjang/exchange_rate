package com.example.mapper;

import com.example.dto.RemittanceStats;
import com.example.dto.RecentRemittanceCount;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface RemittanceMapper {
    
    /**
     * 송금 통계 조회
     */
    RemittanceStats selectRemittanceStats();
    
    /**
     * 최근 7일 송금 건수 조회
     */
    List<RecentRemittanceCount> selectRecent7DaysRemittanceCount();
} 