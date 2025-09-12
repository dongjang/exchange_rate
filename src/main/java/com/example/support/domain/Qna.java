package com.example.support.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.example.common.domain.File;
import com.example.user.domain.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "qna")
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public class Qna {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private QnaStatus status = QnaStatus.PENDING;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id")
    private File file;
    
    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "answered_at")
    private LocalDateTime answeredAt;
    
    @Column(name = "answer_content", columnDefinition = "TEXT")
    private String answerContent;
    
    @Column(name = "answer_user_id")
    private Long answerUserId;
    
    public enum QnaStatus {
        PENDING,    // 대기중
        ANSWERED,   // 답변완료
        CANCELED    // 취소됨
    }
}
