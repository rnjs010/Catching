package com.dongledungle.catching.auth.exception;

/**
 * 토큰 갱신 실패 시 발생하는 예외
 */
public class TokenRefreshException extends RuntimeException {

    /**
     * 기본 생성자
     */
    public TokenRefreshException() {
        super("토큰 갱신에 실패했습니다.");
    }

    /**
     * 메시지를 포함한 생성자
     *
     * @param message 예외 메시지
     */
    public TokenRefreshException(String message) {
        super(message);
    }

    /**
     * 메시지와 원인을 포함한 생성자
     *
     * @param message 예외 메시지
     * @param cause 예외 원인
     */
    public TokenRefreshException(String message, Throwable cause) {
        super(message, cause);
    }
}