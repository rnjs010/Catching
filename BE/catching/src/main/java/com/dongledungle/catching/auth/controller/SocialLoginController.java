package com.dongledungle.catching.auth.controller;

import com.dongledungle.catching.common.response.ApiResponse;
import com.dongledungle.catching.auth.dto.oauth.GoogleAccessTokenRequest;
import com.dongledungle.catching.auth.dto.request.MeRequest;
import com.dongledungle.catching.auth.dto.response.GoogleUserInfoResponseDto;
import com.dongledungle.catching.auth.dto.response.LoginResponse;
import com.dongledungle.catching.auth.dto.response.MeResponse;
import com.dongledungle.catching.auth.dto.token.JwtTokenResponse;
import com.dongledungle.catching.auth.jwt.JwtTokenProvider;
import com.dongledungle.catching.auth.service.GoogleService;
import com.dongledungle.catching.auth.service.JwtTokenService;
import com.dongledungle.catching.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

/**
 * 소셜 로그인 컨트롤러
 * 크롬 익스텐션의 구글 로그인 요청 처리
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SocialLoginController {

    private final GoogleService googleService;
    private final UserService userService;
    private final JwtTokenService jwtTokenService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 크롬 익스텐션에서 받은 "구글 Access Token"으로 로그인 처리
     * POST /api/auth/login
     *
     * @param request 구글 Access Token
     * @return LoginResponse (JWT 토큰 정보)
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> loginWithGoogleAccessToken(
            @RequestBody GoogleAccessTokenRequest request
    ) {
        try {
            String googleAccessToken = request.getAccessToken();
            log.info("[AUTH] 구글 Access Token 로그인 요청, token={}", googleAccessToken);

            // 1. Google 사용자 정보 조회
            GoogleUserInfoResponseDto googleUser = googleService.getUserInfo(googleAccessToken);

            // 2. 로그인 또는 회원가입 처리 (내부에서 JWT 발급)
            Object[] result = userService.processGoogleLogin(googleUser);
            LoginResponse loginResponse = (LoginResponse) result[0];
            boolean isNewUser = (boolean) result[1];

            log.info("[AUTH] 구글 로그인 성공: email={}, isNewUser={}",
                    googleUser.getEmail(), isNewUser);

            // 신규 회원이면 201 CREATED 반환
            if (isNewUser) {
                return ResponseEntity
                        .status(HttpStatus.CREATED)
                        .body(ApiResponse.created("회원가입 및 로그인 성공", loginResponse));
            }

            // 기존 회원이면 200 OK 반환
            return ResponseEntity.ok(ApiResponse.success(loginResponse));

        } catch (Exception e) {
            log.error("[AUTH] 구글 Access Token 로그인 실패", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "구글 로그인에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 현재 로그인한 사용자 정보 조회
     * GET /api/auth/me
     *
     * Authorization: Bearer {accessToken}
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> getMe(
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {
        try {
            // "Bearer xxx.yyy.zzz" 에서 토큰만 추출
            String token = extractToken(authorizationHeader);

            // 토큰에서 userId 추출
            String userIdStr = jwtTokenProvider.getUserIdFromToken(token);
            Long userId = Long.parseLong(userIdStr);

            // 유저 정보 조회
            MeResponse me = userService.getMe(userId);

            return ResponseEntity.ok(ApiResponse.success(me));

        } catch (Exception e) {
            log.error("[AUTH] /me 조회 실패", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<MeResponse>> updateMe(
            Authentication authentication,
            @RequestBody MeRequest request
    ) {
        try {
            Long userId = Long.parseLong((String) authentication.getPrincipal());
            MeResponse updated = userService.updateUserName(userId, request.getName());
            log.info("사용자 정보 수정 성공: userId={}", userId);
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            log.error("사용자 정보 수정 실패", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, "사용자 정보 수정에 실패했습니다."));
        }
    }

    /**
     * 로그아웃
     * POST /api/auth/logout
     *
     * @return ApiResponse<String>
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(Authentication authentication) {
        try {
            Long userId = Long.parseLong((String) authentication.getPrincipal());
            jwtTokenService.logout(String.valueOf(userId));
            return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다."));
        } catch (Exception e) {
            log.error("로그아웃 실패", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, "로그아웃에 실패했습니다."));
        }
    }

    /**
     * Access Token 갱신
     * POST /api/auth/refresh
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, "토큰 갱신에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * "Bearer xxx" 형식의 Authorization 헤더에서 순수 토큰 부분만 추출
     */
    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization 헤더가 올바르지 않습니다.");
        }
        return authorizationHeader.substring(7);
    }

    /**
     * 회원탈퇴 (소프트 삭제)
     * DELETE /api/auth/withdraw
     *
     * @return ApiResponse<String>
     */
    @DeleteMapping("/withdraw")
    public ResponseEntity<ApiResponse<String>> deleteUser(Authentication authentication) {
        try {
            Long userId = Long.parseLong((String) authentication.getPrincipal());
            userService.deleteUser(userId);
            return ResponseEntity.ok(ApiResponse.success("회원탈퇴 되었습니다."));
        } catch (Exception e) {
            log.error("회원탈퇴 실패", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, "회원탈퇴에 실패했습니다."));
        }
    }
}
