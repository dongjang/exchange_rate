package com.example.user.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.example.user.dto.UserResponse;

@Mapper
public interface UserMapper {
    UserResponse getUserById(Long id);
} 