package com.dongledungle.catching.auth.common;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApiResponse<T> {
    private boolean success; // 응답 성공 여부
    private String message;  // 응답 관련 메시지
    private T data;          // 응답 데이터 (제네릭 타입)

    /**
     * ApiResponse 생성자
     * @param success 성공 여부
     * @param message 응답 메시지
     * @param data 응답 데이터
     */
    private ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    /**
     * 성공 응답 생성 (기본 메시지)
     * @param data 응답 데이터
     * @return 성공 응답 객체
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    /**
     * 성공 응답 생성 (사용자 지정 메시지)
     * @param message 응답 메시지
     * @param data 응답 데이터
     * @return 성공 응답 객체
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    /**
     * 실패 응답 생성
     * @param message 오류 메시지
     * @return 실패 응답 객체
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
