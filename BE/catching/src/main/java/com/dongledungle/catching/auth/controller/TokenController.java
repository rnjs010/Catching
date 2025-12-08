package com.dongledungle.catching.auth.controller;

import com.dongledungle.catching.auth.common.ApiResponse;
import com.dongledungle.catching.auth.dto.token.JwtTokenResponse;
import com.dongledungle.catching.auth.service.JwtTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * JWT 토큰 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/token")
@RequiredArgsConstructor
public class TokenController {

    private final JwtTokenService jwtTokenService;

    /**
     * Access Token 갱신
     * POST /api/token/refresh
     *
     * @param refreshToken Refresh Token
     * @return ApiResponse<JwtTokenResponse> (새로운 Access Token)
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<JwtTokenResponse>> refreshToken(
            @RequestHeader("Authorization") String refreshToken) {
        try {
            // "Bearer " 제거
            String token = refreshToken.startsWith("Bearer ")
                    ? refreshToken.substring(7)
                    : refreshToken;

            JwtTokenResponse response = jwtTokenService.refreshAccessToken(token);

            log.info("Access Token 갱신 성공");
            return ResponseEntity.ok(ApiResponse.success(response));

        } catch (Exception e) {
            log.error("Access Token 갱신 실패", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("토큰 갱신에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * Access Token 유효성 검증
     * POST /api/token/validate
     *
     * @param accessToken Access Token
     * @return ApiResponse<Boolean>
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateToken(
            @RequestHeader("Authorization") String accessToken) {
        try {
            String token = accessToken.startsWith("Bearer ")
                    ? accessToken.substring(7)
                    : accessToken;

            boolean isValid = jwtTokenService.validateAccessToken(token);
            return ResponseEntity.ok(ApiResponse.success(isValid));

        } catch (Exception e) {
            log.error("토큰 검증 실패", e);
            return ResponseEntity.ok(ApiResponse.success(false));
        }
    }
}