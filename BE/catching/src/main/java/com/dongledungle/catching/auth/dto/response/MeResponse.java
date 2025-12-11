package com.dongledungle.catching.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그인한 사용자 정보 응답 DTO (/api/auth/me)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeResponse {

    private Long userId;
    private String userName;
    private String email;
    private String notionApiKey;
    private String notionPageId;
}
