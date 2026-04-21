package com.dongledungle.catching.popular.service;

import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.repository.AnalysisRepository;
import com.dongledungle.catching.analysis.service.AnalysisService;
import com.dongledungle.catching.common.util.WeekUtil;
import com.dongledungle.catching.history.repository.HistoryRepository;
import com.dongledungle.catching.popular.dto.PopularAnalysisDto;
import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.lang.reflect.Type;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class PopularAnalysisService {
    private final AnalysisRepository analysisRepository;
    private final HistoryRepository historyRepository;

    /**
     * 특정 주차의 인기 분석 Top 5 조회 (실시간 조회수 포함)
     */
    public List<PopularAnalysisDto> getWeeklyPopular(String yearMonthWeek) {
        List<Object[]> top5 = historyRepository.findTop5ByYearWeek(yearMonthWeek);

        return top5.stream()
                .map(arr -> {
                    Long companyPositionId = (Long) arr[0];
                    Long viewCount = (Long) arr[1];

                    Analysis analysis = analysisRepository.findById(companyPositionId)
                            .orElse(null);

                    if (analysis == null) return null;

                    return PopularAnalysisDto.builder()
                            .companyPositionId(companyPositionId)
                            .company(analysis.getCompany())
                            .position(analysis.getPosition())
                            .viewCount(viewCount)
                            .yearMonthWeek(yearMonthWeek)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * 현재 주차 인기 분석 조회
     */
    public List<PopularAnalysisDto> getCurrentWeekPopular() {
        String currentWeek = WeekUtil.getCurrentYearMonthWeek();

        // 이번주 데이터 먼저 시도
        List<Object[]> top5 = historyRepository.findTop5ByYearWeek(currentWeek);
        String appliedWeekLabel = currentWeek;

        // 만약 이번주 데이터 없다면 전체기간으로 fallback
        if (top5 == null || top5.isEmpty()) {
            log.info("이번 주({}) 인기 분석 데이터가 없어 전체 기간 Top 5로 대체합니다.", currentWeek);
            top5 = historyRepository.findTop5AllTime();
            appliedWeekLabel = "all-time";
        }

        final String finalWeekLabel = appliedWeekLabel;

        return top5.stream()
                .map(arr -> {
                    Long id = (Long) arr[0];
                    Long viewCount = (Long) arr[1];

                    Analysis analysis = analysisRepository.findById(id).orElse(null);
                    if (analysis == null) return null;

                    return PopularAnalysisDto.builder()
                            .companyPositionId(id)
                            .company(analysis.getCompany())
                            .position(analysis.getPosition())
                            .viewCount(viewCount)
                            .yearMonthWeek(finalWeekLabel)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }
}
