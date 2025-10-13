package com.example;

import java.util.TimeZone;

import jakarta.annotation.PostConstruct;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ExProjectApplication {
    
    @PostConstruct
    public void init() {
        // 애플리케이션 전역 시간대를 한국 시간으로 설정
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
    }
    
    public static void main(String[] args) {
        SpringApplication.run(ExProjectApplication.class, args);
    }
} 