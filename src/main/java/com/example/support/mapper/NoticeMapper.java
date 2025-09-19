package com.example.support.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.example.support.dto.NoticeResponse;
import com.example.support.dto.NoticeSearchRequest;

@Mapper
public interface NoticeMapper {
    List<NoticeResponse> getNoticeList(NoticeSearchRequest request);
    int getNoticeCount(NoticeSearchRequest request);
}
