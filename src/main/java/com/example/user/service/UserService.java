package com.example.user.service;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.context.SessionContext;
import com.example.user.domain.User;
import com.example.user.repository.UserRepository;

@Service
public class UserService {
    
    
    @Autowired
    private UserRepository userRepository;

    @Transactional
    public void updateUser(Map<String, Object> userData) {
        Long userId = SessionContext.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 업데이트 가능한 필드들만 수정
        if (userData.containsKey("name")) {
            user.setName((String) userData.get("name"));
        }
        if (userData.containsKey("pictureUrl")) {
            user.setPictureUrl((String) userData.get("pictureUrl"));
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public User saveOrUpdateUser(Map<String, Object> userAttributes) {
        String email = (String) userAttributes.get("email");
        String name = (String) userAttributes.get("name");
        String picture = (String) userAttributes.get("picture");

        // 기존 사용자 확인
        User existingUser = userRepository.findByEmail(email);
        
        if (existingUser != null) {
            // 기존 사용자 정보 업데이트
            //existingUser.setName(name);
            //existingUser.setPictureUrl(picture);
            existingUser.setLastLoginAt(LocalDateTime.now());
            existingUser.setUpdatedAt(LocalDateTime.now());
            
            return userRepository.save(existingUser);
        } else {
            // 새 사용자 생성
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .pictureUrl(picture)
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            
            return userRepository.save(newUser);
        }
    }

    public User findByEmailFromRepository(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * 이메일로 사용자 정보 조회 (ID, 상태 포함)
     */
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public void saveUser(String email, String name, String picture, String provider) {
        // 기존 사용자 확인
        User existingUser = userRepository.findByEmail(email);
        
        if (existingUser != null) {
            // 기존 사용자 정보는 유지, 마지막 로그인/업데이트만 갱신
            existingUser.setLastLoginAt(LocalDateTime.now());
            existingUser.setUpdatedAt(LocalDateTime.now());
            
            userRepository.save(existingUser);
        } else {
            // 새 사용자 생성
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .pictureUrl(picture)
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();
            
            userRepository.save(newUser);
        }
    }
} 