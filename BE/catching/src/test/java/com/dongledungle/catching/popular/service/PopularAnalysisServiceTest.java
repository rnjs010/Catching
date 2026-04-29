package com.dongledungle.catching.popular.service;

import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.repository.AnalysisRepository;
import com.dongledungle.catching.history.repository.HistoryRepository;
import com.dongledungle.catching.popular.dto.PopularAnalysisDto;
import com.dongledungle.catching.popular.service.PopularAnalysisService;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PopularAnalysisService 테스트")
class PopularAnalysisServiceTest {

    @Mock
    private HistoryRepository historyRepository;

    @Mock
    private AnalysisRepository analysisRepository;

    @InjectMocks
    private PopularAnalysisService popularService;

    @Test
    @DisplayName("이번 주 인기 분석 조회 - Analysis 정보 포함")
    void getCurrentWeekPopular() {
        // Given
        String week = "2025-12-W3";

        // History Mock: Top 2
        Object[] result1 = new Object[]{100L, 10L};
        Object[] result2 = new Object[]{200L, 5L};
        when(historyRepository.findTop5ByYearWeek(anyString()))
                .thenReturn(List.of(result1, result2));

        // Analysis Mock
        Analysis analysis1 = Analysis.builder()
                .companyPositionId(100L)
                .company("삼성전자")
                .position("백엔드")
                .content("{\"test\":\"data1\"}")
                .createdAt(LocalDateTime.now())
                .build();

        Analysis analysis2 = Analysis.builder()
                .companyPositionId(200L)
                .company("네이버")
                .position("프론트엔드")
                .content("{\"test\":\"data2\"}")
                .createdAt(LocalDateTime.now())
                .build();

        when(analysisRepository.findById(100L)).thenReturn(Optional.of(analysis1));
        when(analysisRepository.findById(200L)).thenReturn(Optional.of(analysis2));

        // When
        List<PopularAnalysisDto> popular = popularService.getCurrentWeekPopular().getTop5();

        // Then
        assertThat(popular).hasSize(2);

        // 1위 검증
        assertThat(popular.get(0).getCompanyPositionId()).isEqualTo(100L);
        assertThat(popular.get(0).getCompany()).isEqualTo("삼성전자");
        assertThat(popular.get(0).getPosition()).isEqualTo("백엔드");
        assertThat(popular.get(0).getViewCount()).isEqualTo(10L);

        // 2위 검증
        assertThat(popular.get(1).getCompanyPositionId()).isEqualTo(200L);
        assertThat(popular.get(1).getViewCount()).isEqualTo(5L);
    }

    @Test
    @DisplayName("Analysis가 삭제된 경우 null 필터링")
    void filterNullAnalysis() {
        // Given
        Object[] result1 = new Object[]{100L, 10L};
        Object[] result2 = new Object[]{999L, 5L};  // 존재하지 않는 ID

        when(historyRepository.findTop5ByYearWeek(anyString()))
                .thenReturn(List.of(result1, result2));

        Analysis analysis1 = Analysis.builder()
                .companyPositionId(100L)
                .company("삼성전자")
                .position("백엔드")
                .content("{\"test\":\"data\"}")
                .createdAt(LocalDateTime.now())
                .build();

        when(analysisRepository.findById(100L)).thenReturn(Optional.of(analysis1));
        when(analysisRepository.findById(999L)).thenReturn(Optional.empty());  // 없음

        // When
        List<PopularAnalysisDto> popular = popularService.getCurrentWeekPopular().getTop5();

        // Then - null은 필터링됨
        assertThat(popular).hasSize(1);
        assertThat(popular.get(0).getCompanyPositionId()).isEqualTo(100L);
    }
}