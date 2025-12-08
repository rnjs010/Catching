package com.dongledungle.catching.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 구글 사용자 정보 응답 DTO
 * Google OAuth2 API로부터 받은 사용자 정보를 담는 객체
 */
@Getter
@NoArgsConstructor
public class GoogleUserInfoResponseDto {

    /**
     * 구글 고유 ID
     */
    @JsonProperty("id")
    private String id;

    /**
     * 이메일
     */
    @JsonProperty("email")
    private String email;

    /**
     * 이메일 인증 여부
     */
    @JsonProperty("verified_email")
    private Boolean verifiedEmail;

    /**
     * 전체 이름
     */
    @JsonProperty("name")
    private String name;

    /**
     * 이름
     */
    @JsonProperty("given_name")
    private String givenName;

    /**
     * 성
     */
    @JsonProperty("family_name")
    private String familyName;

    /**
     * 프로필 이미지 URL
     */
    @JsonProperty("picture")
    private String picture;

    /**
     * 언어 설정
     */
    @JsonProperty("locale")
    private String locale;
}