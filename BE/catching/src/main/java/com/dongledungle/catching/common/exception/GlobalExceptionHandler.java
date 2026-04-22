package com.dongledungle.catching.common.exception;

import com.dongledungle.catching.common.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

import com.dongledungle.catching.analysis.exception.RateLimitExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    /**
     * DTO의 @Valid 검증 실패 시 발생하는 에러를 잡아서 ApiResponse 형식으로 반환
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(
                        HttpStatus.BAD_REQUEST.value(),
                        "입력값이 올바르지 않습니다.",
                        errors
                ));
    }

    /**
     * Rate Limit 제한에 걸렸을 때 발생하는 예외 (429 Too Many Requests)
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleRateLimitExceeded(RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ApiResponse.error(
                        HttpStatus.TOO_MANY_REQUESTS.value(),
                        ex.getMessage(),
                        Map.of("remainingTime", ex.getRemainingTime())
                ));
    }
}