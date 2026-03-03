package com.dongledungle.catching.popular.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopularAnalysisDto {
    private Long companyPositionId;
    private String company;
    private String position;

    private Long viewCount;  // 실시간 조회수
    private String yearMonthWeek;
}
