package com.example.support.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.support.domain.Admin;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {
    Admin findByAdminId(String adminId);
    Admin findByEmail(String email);
}
