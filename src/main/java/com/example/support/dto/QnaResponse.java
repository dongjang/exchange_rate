package com.example.support.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class QnaResponse {
    private Long id;
    private String title;
    private String content;
    private String status;
    private Long fileId;
    private String fileName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime answeredAt;
    private String answerContent;
    private Long answerUserId;
    private String answerUserName;
    private String userName;
    private Long userId;
    private Long fileSize;
}
