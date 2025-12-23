package com.dongledungle.catching.auth.service;

import com.dongledungle.catching.auth.dto.response.GoogleUserInfoResponseDto;
import com.dongledungle.catching.auth.dto.response.LoginResponse;
import com.dongledungle.catching.auth.dto.response.MeResponse;
import com.dongledungle.catching.auth.dto.token.JwtTokens;
import com.dongledungle.catching.auth.entity.User;
import com.dongledungle.catching.auth.jwt.JwtTokenGenerator;
import com.dongledungle.catching.auth.repository.RefreshTokenRedisRepository;
import com.dongledungle.catching.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final JwtTokenGenerator jwtTokenGenerator;
    private final RefreshTokenRedisRepository refreshTokenRedisRepository;

    @Value("${jwt.refresh-token-expire-time}")
    private long refreshTokenExpireTime;

    /**
     * 구글 로그인 처리
     * - 기존 회원: 로그인
     * - 신규 회원: 회원가입 후 로그인
     *
     * ✅ 로그인 응답은 토큰만 반환 (유저정보는 /api/auth/me)
     */
    @Transactional
    public LoginResponse processGoogleLogin(GoogleUserInfoResponseDto googleUser) {
        Optional<User> existingUser =
                userRepository.findByGoogleIdAndIsDeletedFalse(googleUser.getId());

        User user;
        boolean isNewUser;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            isNewUser = false;
            log.info("기존 회원 로그인: userId={}, email={}", user.getUserId(), user.getEmail());
        } else {
            user = createUserFromGoogle(googleUser);
            isNewUser = true;
            log.info("신규 회원 가입 완료: userId={}, email={}", user.getUserId(), user.getEmail());
        }

        JwtTokens tokens = generateAndSaveTokens(user);

        return LoginResponse.builder()
                .accessToken(tokens.getAccessToken())
                .refreshToken(tokens.getRefreshToken())
                .isNewUser(isNewUser)
                .build();
    }

    /**
     * ✅ /api/auth/me 용: 로그인한 사용자 정보 조회 (노션 제외)
     */
    public MeResponse getMe(Long userId) {
        User user = findById(userId);
        return MeResponse.builder()
                .userName(user.getUserName())
                .email(user.getEmail())
                .build();
    }

    private User createUserFromGoogle(GoogleUserInfoResponseDto googleUser) {
        User newUser = User.builder()
                .googleId(googleUser.getId())
                .email(googleUser.getEmail())
                .userName(googleUser.getName())
                .isDeleted(false)
                .role("ROLE_USER")
                .build();

        return userRepository.save(newUser);
    }

    private JwtTokens generateAndSaveTokens(User user) {
        String userId = String.valueOf(user.getUserId());

        JwtTokens tokens = jwtTokenGenerator.generateTokens(userId);

        // refreshToken Redis 저장
        refreshTokenRedisRepository.save(userId, tokens.getRefreshToken(), refreshTokenExpireTime);

        log.debug("JWT 토큰 생성 완료: userId={}", userId);
        return tokens;
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. userId=" + id));
    }

    /**
     * 사용자 이름 수정
     */
    @Transactional
    public void updateUserName(Long userId, String userName) {
        User user = findById(userId);
        user.updateUserName(userName);
        log.info("사용자 이름 업데이트 완료: userId={}, userName={}", userId, userName);
    }

    /**
     * 사용자 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = findById(userId);
        user.softDelete();

        // Redis에서 Refresh Token 삭제
        refreshTokenRedisRepository.delete(String.valueOf(userId));

        log.info("사용자 삭제 완료: userId={}", userId);
    }

}
