package com.dongledungle.catching.analysis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalysisRequestDto {
    private String today;

    @NotBlank(message = "회사명은 필수 입력 항목입니다.")
    @Size(max = 80, message = "회사명은 최대 80자까지 입력 가능합니다.")
    private String company;

    @NotBlank(message = "직무명은 필수 입력 항목입니다.")
    @Size(max = 80, message = "직무명은 최대 80자까지 입력 가능합니다.")
    private String position;

    @Builder.Default
    private String analysisDepth = "standard"; // brief, standard, detailed

    private Long userId; // 임의로 유저ID 지정

    public String getCompany() {
        return sanitizeInput(this.company);
    }

    public String getPosition() {
        return sanitizeInput(this.position);
    }

    // 입력 문자열 정제
    private String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        // 앞뒤 공백 제거 후 줄바꿈(\n, \r) 및 탭(\t) 문자를 공백 1칸으로 치환
        return input.trim().replaceAll("[\\n\\r\\t]", " ");
    }
}