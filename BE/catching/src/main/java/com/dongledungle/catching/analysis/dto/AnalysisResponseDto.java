package com.dongledungle.catching.analysis.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // null인 필드는 JSON에서 제외
public class AnalysisResponseDto {
    private String company;
    private String position;
    @JsonRawValue
    private String data;
    private String source;          // "redis", "database", "ai"

    // 에러 정보
    private String errorType;       // "INVALID_RESPONSE", "MALFORMED_JSON" 등
    private String errorMessage;    // 사용자 친화적 에러 메시지

    /**
     * 성공 응답 생성
     */
    public static AnalysisResponseDto success(String company, String position, String data, String source) {
        return AnalysisResponseDto.builder()
                .company(company)
                .position(position)
                .data(data)
                .source(source)
                .build();
    }

    /**
     * 실패 응답 생성
     */
    public static AnalysisResponseDto failure(String company, String position, String errorType, String errorMessage) {
        return AnalysisResponseDto.builder()
                .company(company)
                .position(position)
                .errorType(errorType)
                .errorMessage(errorMessage)
                .build();
    }

}
