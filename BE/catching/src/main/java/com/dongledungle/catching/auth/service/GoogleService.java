package com.dongledungle.catching.auth.service;

import com.dongledungle.catching.auth.dto.response.GoogleUserInfoResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * 구글 OAuth2 인증 서비스
 * - 크롬 익스텐션에서 전달받은 Google Access Token으로
 *   구글 사용자 정보를 조회하는 역할만 담당
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleService {

    private final RestTemplate restTemplate;

    // application.yml에 설정된 구글 사용자 정보 조회 엔드포인트
    // 예: https://www.googleapis.com/oauth2/v2/userinfo
    @Value("${google.user-info-uri}")
    private String userInfoUri;

    /**
     * Access Token으로 구글 사용자 정보 조회
     * @param accessToken 프론트(확장프로그램)에서 전달받은 구글 Access Token
     * @return GoogleUserInfoResponseDto (구글 사용자 정보)
     */
    public GoogleUserInfoResponseDto getUserInfo(String accessToken) {
        // 쿼리 파라미터로 access_token 전달 (간단하고 확실한 방식)
        String url = userInfoUri + "?access_token=" + accessToken;

        try {
            ResponseEntity<GoogleUserInfoResponseDto> response =
                    restTemplate.getForEntity(url, GoogleUserInfoResponseDto.class);

            GoogleUserInfoResponseDto userInfo = response.getBody();

            log.info("구글 사용자 정보 조회 성공: email={}",
                    userInfo != null ? userInfo.getEmail() : "null");

            return userInfo;

        } catch (Exception e) {
            log.error("구글 사용자 정보 조회 실패", e);
            throw new RuntimeException("구글 사용자 정보 조회 실패: " + e.getMessage(), e);
        }
    }
}
