package com.example.common.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "file")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class File {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "original_name", nullable = false, length = 200)
    private String originalName;
    
    @Column(name = "stored_name", nullable = false, length = 200)
    private String storedName;
    
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;
    
    @Column(name = "file_size", nullable = false)
    private Long fileSize;
    
    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;
    
    @Column(name = "content_type", length = 100)
    private String contentType;
    
    @Column(name = "upload_user_id", nullable = false)
    private Long uploadUserId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
} 