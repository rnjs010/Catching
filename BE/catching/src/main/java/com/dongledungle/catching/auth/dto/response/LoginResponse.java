package com.dongledungle.catching.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그인 응답 DTO
 * 클라이언트(크롬 익스텐션)에게 전달할 로그인 결과
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    /**
     * JWT Access Token (인증용 토큰)
     */
    private String accessToken;

    /**
     * JWT Refresh Token (Access Token 갱신용)
     */
    private String refreshToken;
}