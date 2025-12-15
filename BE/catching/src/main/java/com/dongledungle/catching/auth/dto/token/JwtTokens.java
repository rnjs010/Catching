package com.dongledungle.catching.auth.dto.token;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * JWT 토큰 쌍 DTO
 * Access Token과 Refresh Token을 함께 관리
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtTokens {

    /**
     * Access Token (단기 인증 토큰)
     */
    private String accessToken;

    /**
     * Refresh Token (장기 갱신 토큰)
     */
    private String refreshToken;
}