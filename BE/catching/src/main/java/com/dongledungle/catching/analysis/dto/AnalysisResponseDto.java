package com.dongledungle.catching.analysis.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
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
    private String status;          // "success" or "failure"
    private String data;            // 분석 결과 JSON 문자열
    private String source;          // "redis", "database", "ai"
    private Long analysisId;        // DB에 저장된 ID
    private Integer attempts;       // AI 호출 시도 횟수

    // 에러 정보
    private String errorType;       // "INVALID_RESPONSE", "MALFORMED_JSON" 등
    private String errorMessage;    // 사용자 친화적 에러 메시지

    /**
     * 성공 응답 생성
     */
    public static AnalysisResponseDto success(String data, String source, Long analysisId) {
        return AnalysisResponseDto.builder()
                .status("success")
                .data(data)
                .source(source)
                .analysisId(analysisId)
                .build();
    }

    /**
     * 실패 응답 생성
     */
    public static AnalysisResponseDto failure(String errorType, String errorMessage, int attempts) {
        return AnalysisResponseDto.builder()
                .status("failure")
                .errorType(errorType)
                .errorMessage(errorMessage)
                .attempts(attempts)
                .build();
    }

}
