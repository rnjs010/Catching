package com.dongledungle.catching.search.dto;

import lombok.Data;

@Data
public class AnalysisRequestDto {
    private String today;
    private String company;
    private String position;
    private String analysisDepth = "standard"; // brief, standard, detailed
}
