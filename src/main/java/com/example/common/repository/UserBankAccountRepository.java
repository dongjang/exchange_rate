package com.example.common.repository;

import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.common.domain.UserBankAccount;

public interface UserBankAccountRepository extends JpaRepository<UserBankAccount, Long> {
    UserBankAccount findByUserId(@Param("userId") Long userId);
} 