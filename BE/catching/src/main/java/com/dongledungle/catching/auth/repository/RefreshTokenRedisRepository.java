package com.dongledungle.catching.auth.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

/**
 * Refresh Token을 Redis에 저장/조회/삭제하는 Repository
 */
@Repository
@RequiredArgsConstructor
public class RefreshTokenRedisRepository {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String KEY_PREFIX = "refreshToken:";

    /**
     * Refresh Token 저장
     * @param userId 사용자 ID
     * @param refreshToken Refresh Token
     * @param expireTime 만료 시간 (밀리초)
     */
    public void save(String userId, String refreshToken, long expireTime) {
        String key = KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, refreshToken, expireTime, TimeUnit.MILLISECONDS);
    }

    /**
     * Refresh Token 조회
     * @param userId 사용자 ID
     * @return Refresh Token (없으면 null)
     */
    public String findByUserId(String userId) {
        String key = KEY_PREFIX + userId;
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Refresh Token 삭제 (로그아웃 시)
     * @param userId 사용자 ID
     */
    public void delete(String userId) {
        String key = KEY_PREFIX + userId;
        redisTemplate.delete(key);
    }

    /**
     * Refresh Token 존재 여부 확인
     * @param userId 사용자 ID
     * @return 존재하면 true, 없으면 false
     */
    public boolean exists(String userId) {
        String key = KEY_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}