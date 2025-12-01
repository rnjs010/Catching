package com.dongledungle.catching.analysis.dto;

import lombok.Data;

@Data
public class AnalysisRequestDto {
    private String today;
    private String company;
    private String position;
    private String analysisDepth = "standard"; // brief, standard, detailed
    private Long userId; // 임의로 유저ID 지정
}
