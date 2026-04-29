package com.dongledungle.catching.popular.controller;

import com.dongledungle.catching.common.response.ApiResponse;
import com.dongledungle.catching.popular.dto.PopularAnalysisResponse;
import com.dongledungle.catching.popular.service.PopularAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/popular")
@RequiredArgsConstructor
public class PopularAnalysisController {
    private final PopularAnalysisService popularService;

    /**
     * 이번 주 인기 분석 Top 5
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<PopularAnalysisResponse>> getCurrentWeekPopular() {
        PopularAnalysisResponse popular = popularService.getCurrentWeekPopular();
        return ResponseEntity.ok(
                ApiResponse.success("이번 주 인기 분석 Top 5", popular)
        );
    }

    /**
     * 특정 주차 인기 분석 Top 5
     */
    @GetMapping("/{yearMonthWeek}")
    public ResponseEntity<ApiResponse<PopularAnalysisResponse>> getWeeklyPopular(
            @PathVariable String yearMonthWeek
    ) {
        PopularAnalysisResponse popular = popularService.getWeeklyPopular(yearMonthWeek);
        return ResponseEntity.ok(
                ApiResponse.success(yearMonthWeek + " 인기 분석 Top 5", popular)
        );
    }
}
