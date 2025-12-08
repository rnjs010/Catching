package com.dongledungle.catching.auth.jwt;

import com.dongledungle.catching.auth.dto.token.JwtTokens;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * JWT 토큰 쌍(Access + Refresh) 생성을 담당
 */
@Component
@RequiredArgsConstructor
public class JwtTokenGenerator {

    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Access Token과 Refresh Token을 함께 생성
     * @param userId 사용자 ID
     * @return JwtTokens (Access Token + Refresh Token)
     */
    public JwtTokens generateTokens(String userId) {
        String accessToken = jwtTokenProvider.createAccessToken(userId);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        return JwtTokens.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}