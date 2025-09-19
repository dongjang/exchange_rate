package com.example.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.example.user.dto.UserResponse;

@Mapper
public interface UserMapper {
    UserResponse getUserById(@Param("id") Long id);
} 