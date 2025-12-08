package com.dongledungle.catching.auth.dto.oauth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * 크롬 익스텐션이 백엔드로 보내는 구글 Access Token 요청 DTO
 */
@Getter
@Setter
public class GoogleAccessTokenRequest {

    /**
     * 백엔드에서 실제로 사용할 필드
     */
    private String accessToken;

    // --- JSON에서 들어오는 여러 이름을 모두 이 필드로 매핑 ---

    @JsonProperty("accessToken")
    public void setAccessTokenFromJson(String accessToken) {
        this.accessToken = accessToken;
    }

    @JsonProperty("token")
    public void setTokenFromJson(String token) {
        this.accessToken = token;
    }

    @JsonProperty("googleAccessToken")
    public void setGoogleAccessTokenFromJson(String googleAccessToken) {
        this.accessToken = googleAccessToken;
    }
}
