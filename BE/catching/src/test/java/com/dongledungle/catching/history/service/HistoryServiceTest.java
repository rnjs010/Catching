package com.dongledungle.catching.history.service;

import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.repository.AnalysisRepository;
import com.dongledungle.catching.history.dto.HistoryDto;
import com.dongledungle.catching.history.entity.History;
import com.dongledungle.catching.history.repository.HistoryRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("HistoryService 테스트")
class HistoryServiceTest {
    @Mock
    private HistoryRepository historyRepository;

    @InjectMocks
    private HistoryService historyService;

    private Long userId;
    private History mockHistory1;
    private History mockHistory2;

    @BeforeEach
    void setUp(){
        userId = 1L;

        mockHistory1 = History.builder()
                .historyId(1L)
                .userId(userId)
                .companyPositionId(100L)
                .yearMonthWeek("2025-12-W3")
                .createdAt(LocalDateTime.now())
                .build();

        mockHistory2 = History.builder()
                .historyId(2L)
                .userId(userId)
                .companyPositionId(200L)
                .yearMonthWeek("2025-12-W2")
                .createdAt(LocalDateTime.now().minusDays(7))
                .build();
    }

    @Test
    @DisplayName("히스토리 조회 성공")
    void getHistory_Success(){
        // given
        List<Object[]> mockResults = List.of(
                new Object[]{mockHistory1, "현대오토에버", "스마트팩토리"},
                new Object[]{mockHistory2, "신한은행", "IT 플랫폼 개발"}
        );

        when(historyRepository.findRecentHistoryWithCompanyPosition(
                eq(userId), any(LocalDateTime.class)))
                .thenReturn(mockResults);

        // when
        List<HistoryDto> result = historyService.getHistory(userId);

        // then
        assertThat(result).hasSize(2);

        HistoryDto dto1 = result.get(0);
        assertThat(dto1.getHistoryId()).isEqualTo(1L);
        assertThat(dto1.getCompanyPositionId()).isEqualTo(100L);
        assertThat(dto1.getCompany()).isEqualTo("현대오토에버");
        assertThat(dto1.getPosition()).isEqualTo("스마트팩토리");
        assertThat(dto1.getCreatedAt()).isNotNull();

        HistoryDto dto2 = result.get(1);
        assertThat(dto2.getHistoryId()).isEqualTo(2L);
        assertThat(dto2.getCompany()).isEqualTo("신한은행");
        assertThat(dto2.getPosition()).isEqualTo("IT 플랫폼 개발");

        verify(historyRepository, times(1))
                .findRecentHistoryWithCompanyPosition(
                        eq(userId), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("사용자 히스토리 조회 - 빈 결과")
    void getHistory_Empty() {
        // given
        when(historyRepository.findRecentHistoryWithCompanyPosition(
                eq(userId), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // when
        List<HistoryDto> result = historyService.getHistory(userId);

        // then
        assertThat(result).isEmpty();
        verify(historyRepository, times(1))
                .findRecentHistoryWithCompanyPosition(
                        eq(userId), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("최근 한 달 필터링 확인")
    void getHistory_OneMonthFilter() {
        // given
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneMonthAgo = now.minusMonths(1);

        when(historyRepository.findRecentHistoryWithCompanyPosition(
                eq(userId), any(LocalDateTime.class)))
                .thenReturn(List.of());

        // when
        historyService.getHistory(userId);

        // then
        verify(historyRepository, times(1))
                .findRecentHistoryWithCompanyPosition(
                        eq(userId),
                        argThat(date ->
                                date.isBefore(now.plusSeconds(1)) &&
                                        date.isAfter(oneMonthAgo.minusSeconds(1))
                        ));
    }

    @Test
    @DisplayName("여러 히스토리 조회 시 정렬 순서 유지")
    void getHistory_OrderVerification() {
        // given
        History recentHistory = History.builder()
                .historyId(1L)
                .userId(userId)
                .companyPositionId(100L)
                .yearMonthWeek("2025-12-W3")
                .createdAt(LocalDateTime.now())
                .build();

        History oldHistory = History.builder()
                .historyId(2L)
                .userId(userId)
                .companyPositionId(200L)
                .yearMonthWeek("2025-11-W4")
                .createdAt(LocalDateTime.now().minusWeeks(2))
                .build();

        // Repository가 이미 정렬된 순서로 반환 (최신순)
        List<Object[]> mockResults = List.of(
                new Object[]{recentHistory, "회사A", "직무A"},
                new Object[]{oldHistory, "회사B", "직무B"}
        );

        when(historyRepository.findRecentHistoryWithCompanyPosition(
                eq(userId), any(LocalDateTime.class)))
                .thenReturn(mockResults);

        // when
        List<HistoryDto> result = historyService.getHistory(userId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getHistoryId()).isEqualTo(1L); // 최신
        assertThat(result.get(1).getHistoryId()).isEqualTo(2L); // 과거
        assertThat(result.get(0).getCreatedAt())
                .isAfter(result.get(1).getCreatedAt());
    }

    @Test
    @DisplayName("히스토리 저장 성공")
    void saveHistory_Success() {
        // given
        Long companyPositionId = 100L;

        // when
        historyService.saveHistory(userId, companyPositionId);

        // then
        verify(historyRepository, times(1)).save(any(History.class));
    }

    @Test
    @DisplayName("히스토리 저장 시 올바른 데이터 생성")
    void saveHistory_CorrectData() {
        // given
        Long companyPositionId = 100L;

        // when
        historyService.saveHistory(userId, companyPositionId);

        // then
        verify(historyRepository, times(1)).save(argThat(history ->
                history.getUserId().equals(userId) &&
                        history.getCompanyPositionId().equals(companyPositionId) &&
                        history.getYearMonthWeek() != null &&
                        history.getCreatedAt() != null
        ));
    }

    @Test
    @DisplayName("히스토리 중복 저장 - 제한 없이 모두 저장")
    void saveHistory_AllowDuplicates() {
        // given
        Long companyPositionId = 100L;

        // when - 동일한 userId, companyPositionId로 3번 저장
        historyService.saveHistory(userId, companyPositionId);
        historyService.saveHistory(userId, companyPositionId);
        historyService.saveHistory(userId, companyPositionId);

        // then - 3번 모두 저장됨
        verify(historyRepository, times(3)).save(any(History.class));
    }
}