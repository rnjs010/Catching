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
    private final RedisTemplate<String, String> redisTemplate;
    private final AnalysisRepository analysisRepository;
    private final HistoryRepository historyRepository;
    private final Gson gson;

    /**
     * 특정 주차의 인기 분석 Top 5 조회 (실시간 조회수 포함)
     */
    public List<PopularAnalysisDto> getWeeklyPopular(String yearMonthWeek) {
        // 1. Redis에서 Top 5 ID 목록 가져오기
        String redisKey = "popular:weekly:" + yearMonthWeek;
        String cachedIds = redisTemplate.opsForValue().get(redisKey);

        if (cachedIds == null) {
            log.warn("Redis에 {}주차 인기 데이터 없음", yearMonthWeek);
            return Collections.emptyList();
        }

        // 2. ID 파싱
        Type listType = new TypeToken<List<Long>>(){}.getType();
        List<Long> top5Ids = gson.fromJson(cachedIds, listType);

        // 3. 각 ID에 대해 분석 정보 + 실시간 조회수 조회
        return top5Ids.stream()
                .map(id -> {
                    // Analysis 정보 조회
                    Analysis analysis = analysisRepository.findById(id)
                            .orElse(null);

                    if (analysis == null) {
                        return null;
                    }

                    // 실시간 조회수 계산 (History 테이블에서)
                    long viewCount = historyRepository.countByCompanyPositionIdAndYearMonthWeek(
                            id, yearMonthWeek
                    );

                    return PopularAnalysisDto.builder()
                            .companyPositionId(id)
                            .company(analysis.getCompany())
                            .position(analysis.getPosition())
                            .content(analysis.getContent())
                            .viewCount(viewCount)  // 실시간 조회수!
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

        // 현재 주는 실시간 집계 (Redis에 없을 수 있음)
        List<Object[]> top5 = historyRepository.findTop5ByYearWeek(currentWeek);

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
                            .content(analysis.getContent())
                            .viewCount(viewCount)
                            .yearMonthWeek(currentWeek)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }
}
