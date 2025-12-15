package com.dongledungle.catching.auth.service;

import com.dongledungle.catching.auth.dto.token.JwtTokenResponse;
import com.dongledungle.catching.auth.exception.TokenRefreshException;
import com.dongledungle.catching.auth.jwt.JwtTokenProvider;
import com.dongledungle.catching.auth.repository.RefreshTokenRedisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * JWT 토큰 갱신 및 검증 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtTokenService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRedisRepository refreshTokenRedisRepository;
    
    @Value("${jwt.refresh-token-expire-time}")
    private long refreshTokenExpireTime;

    /**
     * Refresh Token으로 Access Token 갱신
     * @param refreshToken Refresh Token
     * @return JwtTokenResponse (새로운 Access Token)
     */
    public JwtTokenResponse refreshAccessToken(String refreshToken) {
        // 1. Refresh Token 유효성 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            log.error("유효하지 않은 Refresh Token");
            throw new TokenRefreshException("유효하지 않은 Refresh Token입니다.");
        }

        // 2. Refresh Token에서 사용자 ID 추출
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        // 3. Redis에 저장된 Refresh Token과 비교
        String savedRefreshToken = refreshTokenRedisRepository.findByUserId(userId);
        if (savedRefreshToken == null || !savedRefreshToken.equals(refreshToken)) {
            log.error("Redis에 저장된 Refresh Token과 일치하지 않음. userId={}", userId);
            throw new TokenRefreshException("유효하지 않은 Refresh Token입니다.");
        }

        // 4. 새로운 Token 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(userId);
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);
        
        // 5. 새로운 Refresh Token을 Redis에 저장 (기존것 덮어씀)
        refreshTokenRedisRepository.save(userId, newRefreshToken, refreshTokenExpireTime);

        log.info("Token 갱신 완료: userId={}", userId);

        return JwtTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    /**
     * 로그아웃 처리 (Redis에서 Refresh Token 삭제)
     * @param userId 사용자 ID
     */
    public void logout(String userId) {
        refreshTokenRedisRepository.delete(userId);
        log.info("로그아웃 완료: userId={}", userId);
    }

    /**
     * Access Token 유효성 검증
     * @param accessToken Access Token
     * @return 유효하면 true, 아니면 false
     */
    public boolean validateAccessToken(String accessToken) {
        return jwtTokenProvider.validateToken(accessToken);
    }

    /**
     * Access Token에서 사용자 ID 추출
     * @param accessToken Access Token
     * @return 사용자 ID
     */
    public String getUserIdFromAccessToken(String accessToken) {
        return jwtTokenProvider.getUserIdFromToken(accessToken);
    }
}