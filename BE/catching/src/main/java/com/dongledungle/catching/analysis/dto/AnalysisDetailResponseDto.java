package com.dongledungle.catching.analysis.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AnalysisDetailResponseDto {
    private String company;
    private String position;
    @JsonRawValue
    private String content; // jsonb
    private LocalDateTime createdAt;
}
