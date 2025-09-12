package com.example.config;

import com.example.interceptor.SessionContextInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 설정 클래스
 * - 인터셉터 등록
 * - URL 패턴 설정
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private SessionContextInterceptor sessionContextInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sessionContextInterceptor)
                .addPathPatterns("/api/**") // 모든 API 요청에 적용
                .excludePathPatterns(
                    "/api/oauth2/**",       // OAuth2 관련 API 제외
                    "/api/users/auth/**",   // 사용자 인증 API 제외
                    "/api/public/**",       // 공개 API 제외
                    "/health/**",           // 헬스체크 제외
                    "/static/**",           // 정적 리소스 제외
                    "/css/**",              // CSS 파일 제외
                    "/js/**",               // JavaScript 파일 제외
                    "/images/**"            // 이미지 파일 제외
                );
    }
}
