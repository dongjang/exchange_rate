package com.example.support.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class QnaSearchResult {
    private List<QnaResponse> content;
    private long totalElements;
    private int totalPages;
    private int size;
    
    public QnaSearchResult(List<QnaResponse> content, long totalElements, int size) {
        this.content = content;
        this.totalElements = totalElements;
        this.size = size;
        this.totalPages = (int) Math.ceil((double) totalElements / size);
    }
}

