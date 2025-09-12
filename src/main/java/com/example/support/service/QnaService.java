package com.example.support.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.common.domain.File;
import com.example.common.service.FileService;
import com.example.context.SessionContext;
import com.example.support.domain.Admin;
import com.example.support.domain.Qna;
import com.example.support.dto.QnaRequest;
import com.example.support.dto.QnaResponse;
import com.example.support.dto.QnaSearchRequest;
import com.example.support.dto.QnaSearchResult;
import com.example.support.mapper.QnaMapper;
import com.example.support.repository.AdminRepository;
import com.example.support.repository.QnaRepository;
import com.example.user.domain.User;
import com.example.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class QnaService {
    
    private final QnaRepository qnaRepository;
    private final UserRepository userRepository;
    private final FileService fileService;
    private final QnaMapper qnaMapper;
    private final AdminRepository adminRepository;
    
    @Transactional(readOnly = true)
    public QnaSearchResult searchQna(QnaSearchRequest request) {
        // 검색 조건 설정
        Long userId = SessionContext.getCurrentUserId();
        System.out.println("userId탐3: "+userId);
        request.setUserId(userId);
        request.setExcludeCanceled(true);
                
        List<QnaResponse> list = qnaMapper.selectQnaList(request);
        int totalCount = qnaMapper.selectQnaCount(request);
        
        return new QnaSearchResult(list, totalCount, request.getSize());
    }
    
    @Transactional
    public QnaResponse createQna(QnaRequest request) {
        Long userId = SessionContext.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Qna qna = new Qna();
        qna.setUser(user);
        qna.setTitle(request.getTitle());
        qna.setContent(request.getContent());
        qna.setStatus(Qna.QnaStatus.PENDING);
        qna.setCreatedAt(LocalDateTime.now());
        
        // 파일 처리
        if (request.getFile() != null && !request.getFile().isEmpty()) {
            try {
                File file = fileService.uploadFile(request.getFile(), userId);
                qna.setFile(file);
            } catch (Exception e) {
                throw new RuntimeException("파일 업로드에 실패했습니다.", e);
            }
        }
        
        Qna savedQna = qnaRepository.save(qna);
        return convertToResponse(savedQna);
    }
    
    @Transactional
    public QnaResponse updateQna(Long qnaId, QnaRequest request) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new RuntimeException("Q&A를 찾을 수 없습니다."));
        
        Long userId = SessionContext.getCurrentUserId();
        
        // PENDING 상태가 아니면 수정 불가
        if (qna.getStatus() != Qna.QnaStatus.PENDING) {
            throw new RuntimeException("답변이 완료된 Q&A는 수정할 수 없습니다.");
        }
        
        qna.setTitle(request.getTitle());
        qna.setContent(request.getContent());
        qna.setUpdatedAt(LocalDateTime.now());
        
        // 파일 처리
        if (request.getFile() != null && !request.getFile().isEmpty()) {
            // 기존 파일 삭제
            if (qna.getFile() != null) {
                fileService.deleteFile(qna.getFile().getId());
            }
            
            // 새 파일 저장
            try {
                File file = fileService.uploadFile(request.getFile(), userId);
                qna.setFile(file);
            } catch (Exception e) {
                throw new RuntimeException("파일 업로드에 실패했습니다.", e);
            }
        }else if(request.isRemoveExistingFile()){
            if(qna.getFile() != null){
                fileService.deleteFile(qna.getFile().getId());
                qna.setFile(null);
            }
        }
        
        Qna updatedQna = qnaRepository.save(qna);
        return convertToResponse(updatedQna);
    }
    
    @Transactional
    public void cancelQna(Long qnaId) {

        Qna qna = qnaRepository.findById(qnaId)
                .orElseThrow(() -> new RuntimeException("Q&A를 찾을 수 없습니다."));
                
        // PENDING 상태가 아니면 취소 불가
        if (qna.getStatus() != Qna.QnaStatus.PENDING) {
            throw new RuntimeException("답변이 완료된 Q&A는 취소할 수 없습니다.");
        }
        
        qnaMapper.updateQnaStatus(qnaId, "CANCELED");
    }
    
    private QnaResponse convertToResponse(Qna qna) {
        QnaResponse response = new QnaResponse();
        response.setId(qna.getId());
        response.setTitle(qna.getTitle());
        response.setContent(qna.getContent());
        response.setStatus(qna.getStatus().name());
        response.setCreatedAt(qna.getCreatedAt());
        response.setUpdatedAt(qna.getUpdatedAt());
        response.setAnsweredAt(qna.getAnsweredAt());
        response.setAnswerContent(qna.getAnswerContent());
        
        if (qna.getUser() != null) {
            response.setUserId(qna.getUser().getId());
            response.setUserName(qna.getUser().getName());
        }
        
        if (qna.getFile() != null) {
            response.setFileId(qna.getFile().getId());
            response.setFileName(qna.getFile().getOriginalName());
        }
        
        if (qna.getAnswerUserId() != null) {
            response.setAnswerUserId(qna.getAnswerUserId());
            Admin answerUser = adminRepository.findById(qna.getAnswerUserId())
                    .orElseThrow(() -> new RuntimeException("답변자를 찾을 수 없습니다."));
            response.setAnswerUserName(answerUser.getName());
        }
        
        return response;
    }
        
    //user
    @Transactional(readOnly = true)
    public QnaResponse getQnaById(Long qnaId) {
        Qna qna = qnaRepository.findById(qnaId)
                .orElse(null);
        
        if (qna == null) {
            return null;
        }
        
        return convertToResponse(qna);
    }
} 