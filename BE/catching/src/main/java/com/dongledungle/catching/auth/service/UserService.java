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

/**
 * 사용자 관련 비즈니스 로직 서비스
 * 회원가입, 로그인, 정보 수정 등을 처리
 */
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
     * - 기존 회원: 로그인 처리
     * - 신규 회원: 회원가입 후 로그인
     *
     * @param googleUser 구글 사용자 정보
     * @return Object[] {LoginResponse (토큰), boolean (신규 여부)}
     */
    @Transactional
    public Object[] processGoogleLogin(GoogleUserInfoResponseDto googleUser) {
        // 1. 구글 ID로 삭제되지 않은 회원 조회
        Optional<User> existingUser =
                userRepository.findByGoogleIdAndIsDeletedFalse(googleUser.getId());

        User user;
        boolean isNewUser;

        if (existingUser.isPresent()) {
            // 2-1. 기존 회원 로그인
            user = existingUser.get();
            isNewUser = false;
            log.info("기존 회원 로그인: userId={}, email={}", user.getUserId(), user.getEmail());
        } else {
            // 2-2. 신규 회원 가입
            user = createUserFromGoogle(googleUser);
            isNewUser = true;
            log.info("신규 회원 가입 완료: userId={}, email={}", user.getUserId(), user.getEmail());
        }

        // 3. JWT 토큰 생성 (Access + Refresh)
        JwtTokens tokens = generateAndSaveTokens(user);

        // 4. 로그인 응답 DTO 생성
        LoginResponse loginResponse = LoginResponse.builder()
                .accessToken(tokens.getAccessToken())
                .refreshToken(tokens.getRefreshToken())
                .build();

        return new Object[]{loginResponse, isNewUser};
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = findById(userId);

        return MeResponse.builder()
                .userName(user.getUserName())
                .email(user.getEmail())
                .build();
    }



    /**
     * 구글 사용자 정보로 새 회원 생성
     * @param googleUser 구글 사용자 정보
     * @return 생성된 User 엔티티
     */
    private User createUserFromGoogle(GoogleUserInfoResponseDto googleUser) {
        User newUser = User.builder()
                .googleId(googleUser.getId())       // 구글 고유 ID(sub)
                .email(googleUser.getEmail())
                .userName(googleUser.getName())
                .isDeleted(false)
                .role("ROLE_USER")                  // ★ 기본 역할 반드시 세팅
                .build();

        return userRepository.save(newUser);
    }

    /**
     * JWT 토큰 생성 및 Redis에 Refresh Token 저장
     * @param user 사용자 엔티티
     * @return JwtTokens (Access + Refresh)
     */
    private JwtTokens generateAndSaveTokens(User user) {
        String userId = String.valueOf(user.getUserId());

        // 1. JWT 토큰 쌍 생성
        JwtTokens tokens = jwtTokenGenerator.generateTokens(userId);

        // 2. Refresh Token을 Redis에 저장 (만료 시간 포함)
        refreshTokenRedisRepository.save(userId, tokens.getRefreshToken(), refreshTokenExpireTime);

        log.debug("JWT 토큰 생성 완료: userId={}", userId);
        return tokens;
    }

    /**
     * 사용자 ID로 조회
     * @param id 사용자 ID
     * @return User 엔티티
     */
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. userId=" + id));
    }


    /**
     * 사용자 이름 수정
     *
     * @param userId   사용자 ID
     * @param userName 새 사용자 이름
     * @return MeResponse
     */
    @Transactional
    public MeResponse updateUserName(Long userId, String userName) {
        User user = findById(userId);
        user.updateUserName(userName);
        log.info("사용자 이름 업데이트 완료: userId={}, userName={}", userId, userName);
        return MeResponse.builder()
                .userName(user.getUserName())
                .email(user.getEmail())
                .build();
    }
    /**
     * 사용자 삭제 (소프트 삭제)
     * @param userId 사용자 ID
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
