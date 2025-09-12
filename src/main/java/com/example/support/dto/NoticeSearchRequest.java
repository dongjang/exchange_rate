package com.example.support.dto;

import lombok.Data;

@Data
public class NoticeSearchRequest {
    private String title;
    private String content;
    private String status;
    private String priority;
    private int page;
    private int size;
    private String sortOrder = "latest";
    private Boolean isUserSearch = false;
}
