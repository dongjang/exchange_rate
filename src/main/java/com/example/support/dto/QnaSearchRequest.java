package com.example.support.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QnaSearchRequest {
    private String title;
    private String content;
    private String status;
    private Long userId;
    private Boolean excludeCanceled;
    private String sortOrder;
    private int page;
    private int size;
}
