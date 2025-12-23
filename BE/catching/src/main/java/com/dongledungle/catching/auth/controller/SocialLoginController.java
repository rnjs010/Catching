package com.dongledungle.catching.auth.controller;

import com.dongledungle.catching.auth.dto.oauth.GoogleAccessTokenRequest;
import com.dongledungle.catching.auth.dto.response.GoogleUserInfoResponseDto;
import com.dongledungle.catching.auth.dto.response.LoginResponse;
import com.dongledungle.catching.auth.dto.response.MeResponse;
import com.dongledungle.catching.auth.jwt.JwtTokenProvider;
import com.dongledungle.catching.auth.service.GoogleService;
import com.dongledungle.catching.auth.service.UserService;
import com.dongledungle.catching.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SocialLoginController {

    private final GoogleService googleService;
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * POST /api/auth/login
     * - 신규 회원이면 201
     * - 기존 회원이면 200
     * ✅ 응답은 토큰만 내려줌
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> loginWithGoogleAccessToken(
            @RequestBody GoogleAccessTokenRequest request
    ) {
        try {
            String googleAccessToken = request.getAccessToken();
            log.info("[AUTH] 구글 Access Token 로그인 요청");

            GoogleUserInfoResponseDto googleUser = googleService.getUserInfo(googleAccessToken);
            LoginResponse loginResponse = userService.processGoogleLogin(googleUser);

            log.info("[AUTH] 구글 로그인 성공: email={}, isNewUser={}",
                    googleUser.getEmail(), loginResponse.isNewUser());

            if (loginResponse.isNewUser()) {
                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.created(loginResponse));
            }

            return ResponseEntity.ok(ApiResponse.success(loginResponse));

        } catch (Exception e) {
            log.error("[AUTH] 구글 Access Token 로그인 실패", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED,
                            "구글 로그인에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * GET /api/auth/me
     * Authorization: Bearer {accessToken}
     * ✅ 유저정보는 여기서만 내려줌 (노션 제외)
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> getMe(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {
        try {
            String token = extractToken(authorizationHeader);
            String userIdStr = jwtTokenProvider.getUserIdFromToken(token);
            Long userId = Long.parseLong(userIdStr);

            MeResponse me = userService.getMe(userId);
            return ResponseEntity.ok(ApiResponse.success(me));

        } catch (Exception e) {
            log.error("[AUTH] /me 조회 실패", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization 헤더가 올바르지 않습니다.");
        }
        return authorizationHeader.substring(7);
    }

    @DeleteMapping("/withdraw")
    public ResponseEntity<ApiResponse<String>> withdraw(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {
        try {
            String token = extractToken(authorizationHeader);
            String userIdStr = jwtTokenProvider.getUserIdFromToken(token);
            Long userId = Long.parseLong(userIdStr);

            userService.deleteUser(userId);

            return ResponseEntity.ok(ApiResponse.success("회원탈퇴가 완료되었습니다."));
        } catch (Exception e) {
            log.error("회원탈퇴 실패", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, "회원탈퇴에 실패했습니다."));
        }
    }

}
