package com.example.user.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Integer dailyLimit;
    private Integer monthlyLimit;
    private Integer singleLimit;
    private String limitType;
    private String status;
    private String pictureUrl;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
} 