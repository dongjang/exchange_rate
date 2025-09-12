package com.example.support.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.example.support.dto.NoticeResponse;
import com.example.support.dto.NoticeSearchRequest;

import java.util.List;

@Mapper
public interface NoticeMapper {
    List<NoticeResponse> getNoticeList(NoticeSearchRequest request);
    int getNoticeCount(NoticeSearchRequest request);
}
