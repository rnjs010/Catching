package com.dongledungle.catching.popular.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopularAnalysisResponse {
    private long totalCount;                 // top5 계산에 사용된 총 히스토리 개수
    private List<PopularAnalysisDto> top5;
}
