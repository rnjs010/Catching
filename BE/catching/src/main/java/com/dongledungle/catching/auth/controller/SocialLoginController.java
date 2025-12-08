package com.dongledungle.catching.auth.controller;

import com.dongledungle.catching.auth.common.ApiResponse;
import com.dongledungle.catching.auth.dto.oauth.GoogleAccessTokenRequest;
import com.dongledungle.catching.auth.dto.response.GoogleUserInfoResponseDto;
import com.dongledungle.catching.auth.dto.response.LoginResponse;
import com.dongledungle.catching.auth.service.GoogleService;
import com.dongledungle.catching.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    /**
     * 크롬 익스텐션에서 받은 "구글 Access Token"으로 로그인 처리
     * POST /api/auth/login
     *
     * @param request 구글 Access Token
     * @return LoginResponse (JWT + 사용자 정보)
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> loginWithGoogleAccessToken(
            @RequestBody GoogleAccessTokenRequest request
    ) {
        try {
            String googleAccessToken = request.getAccessToken(); // ★ 여기
            log.info("[AUTH] 구글 Access Token 로그인 요청, token={}", googleAccessToken);

            // 1. Access Token으로 구글 사용자 정보 조회
            GoogleUserInfoResponseDto googleUser = googleService.getUserInfo(googleAccessToken);

            // 2. 회원가입 or 로그인 처리
            LoginResponse loginResponse = userService.processGoogleLogin(googleUser);

            log.info("[AUTH] 구글 로그인 성공: email={}, isNewUser={}",
                    googleUser.getEmail(), loginResponse.isNewUser());

            return ResponseEntity.ok(ApiResponse.success(loginResponse));

        } catch (Exception e) {
            log.error("[AUTH] 구글 Access Token 로그인 실패", e);
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("구글 로그인에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 로그아웃
     * POST /api/auth/logout
     *
     * @param userId 사용자 ID
     * @return ApiResponse<String>
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestParam Long userId) {
        try {
            userService.deleteUser(userId);
            log.info("로그아웃 성공: userId={}", userId);
            return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다."));
        } catch (Exception e) {
            log.error("로그아웃 실패", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("로그아웃에 실패했습니다."));
        }
    }
}
