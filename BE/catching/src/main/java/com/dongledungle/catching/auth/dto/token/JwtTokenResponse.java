package com.dongledungle.catching.auth.dto.token;

import com.dongledungle.catching.auth.entity.User;
import lombok.Builder;
import lombok.Data;

/**
 * 프론트(크롬 익스텐션)으로 내려줄 응답 DTO
 * 토큰 + 최소한의 유저정보 포함
 */
@Data
@Builder
public class JwtTokenResponse {

    private String accessToken;
    private String refreshToken;

    private Long userId;
    private String email;
    private String name;

    public static JwtTokenResponse of(JwtTokens tokens, User user) {
        return JwtTokenResponse.builder()
                .accessToken(tokens.getAccessToken())
                .refreshToken(tokens.getRefreshToken())
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getUserName())
                .build();
    }
}
