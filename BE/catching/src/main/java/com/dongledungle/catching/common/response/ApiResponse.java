package com.dongledungle.catching.common.response;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@NoArgsConstructor
public class ApiResponse<T> {
    private int status;
    private boolean success;
    private String message;
    private T data;

    @Builder
    public ApiResponse(int status, boolean success, String message, T data){
        this.status = status;
        this.success = success;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(String message, T data){
        return ApiResponse.<T>builder()
                .status(HttpStatus.OK.value())
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success("요청이 성공했습니다", data);
    }

    public static <T> ApiResponse<T> success(String message) {
        return success(message, null);
    }

    public static <T> ApiResponse<T> success(HttpStatus httpStatus, String message, T data) {
        return ApiResponse.<T>builder()
                .status(httpStatus.value())
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
                .status(HttpStatus.CREATED.value())
                .success(true)
                .message("리소스가 생성되었습니다")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return ApiResponse.<T>builder()
                .status(HttpStatus.CREATED.value())
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(HttpStatus httpStatus, String message) {
        return ApiResponse.<T>builder()
                .status(httpStatus.value())
                .success(false)
                .message(message)
                .data(null)
                .build();
    }

    public static <T> ApiResponse<T> error(int status, String message) {
        return ApiResponse.<T>builder()
                .status(status)
                .success(false)
                .message(message)
                .data(null)
                .build();
    }

    public static <T> ApiResponse<T> error(int status, String message, T errorData) {
        return ApiResponse.<T>builder()
                .status(status)
                .success(false)
                .message(message)
                .data(errorData)
                .build();
    }
}
