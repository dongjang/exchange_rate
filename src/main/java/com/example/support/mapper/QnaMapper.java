package com.example.support.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.support.dto.QnaResponse;
import com.example.support.dto.QnaSearchRequest;

import java.util.List;

@Mapper
public interface QnaMapper {
    
    List<QnaResponse> selectQnaList(QnaSearchRequest request);
    
    int selectQnaCount(QnaSearchRequest request);
    
    void updateQnaStatus(@Param("qnaId") Long qnaId, @Param("status") String status);
} 