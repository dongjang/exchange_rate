package com.example.common.service;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Redis 서비스 클래스
 * - 세션 관리
 * - 캐시 관리
 * - 데이터 저장/조회/삭제
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 데이터 저장 (TTL 없음)
     */
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            log.info("Redis 저장 성공 - Key: {}", key);
        } catch (Exception e) {
            log.error("Redis 저장 실패 - Key: {}, Error: {}", key, e.getMessage());
        }
    }

    /**
     * 데이터 저장 (TTL 설정)
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
            log.info("Redis 저장 성공 - Key: {}, TTL: {} {}", key, timeout, unit);
        } catch (Exception e) {
            log.error("Redis 저장 실패 - Key: {}, Error: {}", key, e.getMessage());
        }
    }

    /**
     * 데이터 조회
     */
    public Object get(String key) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            log.info("Redis 조회 성공 - Key: {}", key);
            return value;
        } catch (Exception e) {
            log.error("Redis 조회 실패 - Key: {}, Error: {}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 데이터 삭제
     */
    public boolean delete(String key) {
        try {
            Boolean result = redisTemplate.delete(key);
            log.info("Redis 삭제 성공 - Key: {}", key);
            return result != null && result;
        } catch (Exception e) {
            log.error("Redis 삭제 실패 - Key: {}, Error: {}", key, e.getMessage());
            return false;
        }
    }

    /**
     * 키 존재 여부 확인
     */
    public boolean exists(String key) {
        try {
            Boolean result = redisTemplate.hasKey(key);
            return result != null && result;
        } catch (Exception e) {
            log.error("Redis 키 확인 실패 - Key: {}, Error: {}", key, e.getMessage());
            return false;
        }
    }

    /**
     * TTL 조회 (초 단위)
     */
    public Long getTtl(String key) {
        try {
            return redisTemplate.getExpire(key, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Redis TTL 조회 실패 - Key: {}, Error: {}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 사용자 세션 저장
     */
    public void setUserSession(String userId, Object sessionData) {
        String key = "user:session:" + userId;
        set(key, sessionData, 60, TimeUnit.MINUTES); // 60분 TTL
    }

    /**
     * 사용자 세션 조회
     */
    public Object getUserSession(String userId) {
        String key = "user:session:" + userId;
        return get(key);
    }

    /**
     * 사용자 세션 삭제
     */
    public boolean deleteUserSession(String userId) {
        String key = "user:session:" + userId;
        return delete(key);
    }

}
