package com.example.context;

import lombok.Getter;
import lombok.Setter;

/**
 * 세션 컨텍스트 클래스
 * - ThreadLocal을 사용하여 요청별 세션 정보 저장
 * - 사용자와 관리자 세션 정보를 통합 관리
 */
@Getter
@Setter
public class SessionContext {
    
    private static final ThreadLocal<SessionContext> contextHolder = new ThreadLocal<>();
    
    // 사용자 정보
    private Long userId;
    private String userEmail;
    private String userName;
    
    /**
     * 컨텍스트 설정
     */
    public static void setContext(SessionContext context) {
        contextHolder.set(context);
    }
    
    /**
     * 컨텍스트 조회
     */
    public static SessionContext getContext() {
        return contextHolder.get();
    }
    
    /**
     * 컨텍스트 초기화
     */
    public static void clear() {
        contextHolder.remove();
    }
    
    /**
     * 사용자 ID 조회
     */
    public static Long getCurrentUserId() {
        SessionContext context = getContext();
        return context != null ? context.getUserId() : null;
    }
    
    /**
     * 사용자 이메일 조회
     */
    public static String getCurrentUserEmail() {
        SessionContext context = getContext();
        return context != null ? context.getUserEmail() : null;
    }
    
    /**
     * 사용자 이름 조회
     */
    public static String getCurrentUserName() {
        SessionContext context = getContext();
        return context != null ? context.getUserName() : null;
    }
    
    
}
