package com.dongledungle.catching.popular.repository;

import com.dongledungle.catching.history.entity.History;
import com.dongledungle.catching.history.repository.HistoryRepository;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("인기 분석 집계 테스트")
public class PopularAnalysisRepositoryTest {
    @Autowired
    private HistoryRepository historyRepository;

    @Test
    @DisplayName("주차별 Top 5 집계 - 조회수 순서대로")
    void findTop5ByYearWeek() {
        // Given - 같은 주차에 여러 분석 조회
        String targetWeek = "2025-12-W1";

        // 분석 ID 100: 5회
        createHistories(100L, targetWeek, 6);

        // 분석 ID 200: 3회
        createHistories(200L, targetWeek, 4);

        // 분석 ID 300: 7회 (1위)
        createHistories(300L, targetWeek, 7);

        // 분석 ID 400: 2회
        createHistories(400L, targetWeek, 3);

        // 분석 ID 500: 4회
        createHistories(500L, targetWeek, 5);

        // 분석 ID 600: 1회 (6위, Top 5에 안 들어감)
        createHistories(600L, targetWeek, 1);

        // When
        List<Object[]> top5 = historyRepository.findTop5ByYearWeek(targetWeek);

        // Then
        assertThat(top5).hasSize(5);  // Top 5만

        // 순서 검증 (조회수 내림차순)
        assertThat((Long) top5.get(0)[0]).isEqualTo(300L);  // 1위: 7회
        assertThat((Long) top5.get(0)[1]).isEqualTo(7L);

        assertThat((Long) top5.get(1)[0]).isEqualTo(100L);  // 2위: 6회
        assertThat((Long) top5.get(1)[1]).isEqualTo(6L);

        assertThat((Long) top5.get(2)[0]).isEqualTo(500L);  // 3위: 5회
        assertThat((Long) top5.get(2)[1]).isEqualTo(5L);

        assertThat((Long) top5.get(3)[0]).isEqualTo(200L);  // 4위: 4회
        assertThat((Long) top5.get(3)[1]).isEqualTo(4L);

        assertThat((Long) top5.get(4)[0]).isEqualTo(400L);  // 5위: 3회
        assertThat((Long) top5.get(4)[1]).isEqualTo(3L);

        // 6위는 포함 안 됨
        assertThat(top5.stream().noneMatch(arr -> arr[0].equals(600L))).isTrue();
    }

    @Test
    @DisplayName("다른 주차 데이터는 집계 안 됨")
    void findTop5ExcludesOtherWeeks() {
        // Given
        String targetWeek = "2025-12-W2";
        String otherWeek = "2025-12-W3";

        // 대상 주차: ID 100, 3회
        createHistories(100L, targetWeek, 3);

        // 다른 주차: ID 200, 10회 (더 많지만 제외되어야 함)
        createHistories(200L, otherWeek, 10);

        // When
        List<Object[]> top5 = historyRepository.findTop5ByYearWeek(targetWeek);

        // Then
        assertThat(top5).hasSize(1);  // ID 100만
        assertThat((Long) top5.get(0)[0]).isEqualTo(100L);
    }

    @Test
    @DisplayName("History가 없으면 빈 리스트 반환")
    void findTop5ReturnsEmptyWhenNoData() {
        // Given
        String emptyWeek = "2025-01-W1";

        // When
        List<Object[]> top5 = historyRepository.findTop5ByYearWeek(emptyWeek);

        // Then
        assertThat(top5).isEmpty();
    }

    // 여러 History 생성
    private void createHistories(Long companyPositionId, String yearMonthWeek, int count) {
        for (int i = 0; i < count; i++) {
            History history = History.builder()
                    .userId((long) (i + 1))  // 서로 다른 사용자
                    .companyPositionId(companyPositionId)
                    .yearMonthWeek(yearMonthWeek)
                    .createdAt(LocalDateTime.now())
                    .build();

            historyRepository.save(history);
        }
    }
}
