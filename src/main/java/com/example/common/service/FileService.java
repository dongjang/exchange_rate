package com.example.common.service;

import com.example.common.domain.File;
import com.example.common.repository.FileRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class FileService {
    
    @Value("${file.upload.path:uploads}")
    private String uploadPath;
    
    private final FileRepository fileRepository;
    
    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }
    
    public File uploadFile(MultipartFile multipartFile, Long uploadUserId) throws IOException {
        // 업로드 디렉토리 생성
        Path uploadDir = Paths.get(uploadPath);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
        
        // 파일명 생성 (UUID 사용)
        String originalFilename = multipartFile.getOriginalFilename();
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String storedFilename = UUID.randomUUID().toString() + fileExtension;
        
        // 파일 저장
        Path filePath = uploadDir.resolve(storedFilename);
        Files.copy(multipartFile.getInputStream(), filePath);
        
        // DB에 파일 정보 저장
        File file = new File();
        file.setOriginalName(originalFilename);
        file.setStoredName(storedFilename);
        file.setFilePath(filePath.toAbsolutePath().toString());
        file.setFileSize(multipartFile.getSize());
        file.setFileType(multipartFile.getContentType());
        file.setUploadUserId(uploadUserId);
        file.setCreatedAt(LocalDateTime.now());
        
        return fileRepository.save(file);
    }
    
    public List<File> getFilesByUserId(Long uploadUserId) {
        return fileRepository.findByUploadUserId(uploadUserId);
    }
    
    public void deleteFile(Long fileId) {
        File file = fileRepository.findById(fileId).orElse(null);
        if (file != null) {
            try {
                // 실제 파일 시스템에서 파일 삭제
                Path filePath = Paths.get(file.getFilePath());
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                }
            } catch (IOException e) {
                // 파일 삭제 실패 시에도 DB에서 삭제 진행
                System.err.println("파일 시스템에서 파일 삭제 실패: " + e.getMessage());
            }
            // DB에서 파일 정보 삭제
            fileRepository.deleteById(fileId);
        }
    }
    
    public void deleteFilesByUserId(Long uploadUserId) {
        fileRepository.deleteByUploadUserId(uploadUserId);
    }
    
    public File getFileById(Long fileId) {
        return fileRepository.findById(fileId).orElse(null);
    }
    
    public Resource loadFileAsResource(Long fileId) throws IOException {
        File file = getFileById(fileId);
        if (file == null) {
            return null;
        }
        
        // Try multiple paths to find the file
        Path[] possiblePaths = {
            Paths.get(uploadPath, file.getStoredName()),
            Paths.get(file.getFilePath()),
            Paths.get("uploads", file.getStoredName()),
            Paths.get(System.getProperty("user.dir"), "uploads", file.getStoredName())
        };
        
        for (int i = 0; i < possiblePaths.length; i++) {
            Path path = possiblePaths[i];
            
            if (Files.exists(path) && Files.isReadable(path)) {
                Resource resource = new UrlResource(path.toUri());
                
                if (resource.exists() && resource.isReadable()) {
                    return resource;
                }
            }
        }
        
        return null;
    }
} 