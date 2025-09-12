package com.example.support.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.support.dto.QnaRequest;
import com.example.support.dto.QnaResponse;
import com.example.support.dto.QnaSearchRequest;
import com.example.support.dto.QnaSearchResult;
import com.example.support.service.QnaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/qna")
@RequiredArgsConstructor
public class QnaController {
    
    private final QnaService userQnaService;
    
    @PostMapping("/search")
    public ResponseEntity<QnaSearchResult> searchQna(
            @RequestBody QnaSearchRequest request) {
        
        QnaSearchResult result = userQnaService.searchQna(request);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{qnaId}")
    public ResponseEntity<QnaResponse> getQnaById(
            @PathVariable Long qnaId) {
                
        QnaResponse qna = userQnaService.getQnaById(qnaId);
        
        return ResponseEntity.ok(qna);
    }
    
    @PostMapping
    public ResponseEntity<QnaResponse> createQna(
            @ModelAttribute QnaRequest request) {
        
        QnaResponse result = userQnaService.createQna(request);
        return ResponseEntity.ok(result);
    }
    
    @PutMapping("/{qnaId}")
    public ResponseEntity<QnaResponse> updateQna(
            @PathVariable Long qnaId,
            @ModelAttribute QnaRequest request,
            @AuthenticationPrincipal OAuth2User oauth2User) {
                
        QnaResponse result = userQnaService.updateQna(qnaId, request);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/{qnaId}/cancel")
    public ResponseEntity<Void> cancelQna(
            @PathVariable Long qnaId) {
        
        userQnaService.cancelQna(qnaId);
        return ResponseEntity.ok().build();
    }
}
