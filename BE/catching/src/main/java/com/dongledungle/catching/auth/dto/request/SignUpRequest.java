package com.dongledungle.catching.auth.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원가입 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SignUpRequest {

    /**
     * 사용자 이름
     */
    private String userName;

    /**
     * 이메일
     */
    private String email;

    /**
     * 비밀번호
     */
    private String password;
}