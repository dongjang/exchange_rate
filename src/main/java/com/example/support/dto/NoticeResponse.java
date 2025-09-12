package com.example.support.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NoticeResponse {
    private Long id;
    private String title;
    private String content;
    private String status;
    private String priority;
    private LocalDateTime noticeStartAt;
    private LocalDateTime noticeEndAt;
    private String effectivePriority;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdUserId;
    private String createdUserName;
    private String updatedUserName;
}
