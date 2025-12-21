package com.dongledungle.catching.history.repository;

import com.dongledungle.catching.history.entity.History;
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
@DisplayName("HistoryRepository 테스트")
public class HistoryRepositoryTest {
    @Autowired
    private HistoryRepository historyRepository;

    @Test
    @DisplayName("History 저장 및 조회")
    void saveAndFind() {
        // Given
        History history = History.builder()
                .userId(1L)
                .companyPositionId(100L)
                .yearMonthWeek("2025-09-W3")
                .createdAt(LocalDateTime.now())
                .build();

        // When
        History saved = historyRepository.save(history);
        History found = historyRepository.findById(saved.getHistoryId()).orElseThrow();

        // Then
        assertThat(found.getUserId()).isEqualTo(1L);
        assertThat(found.getYearMonthWeek()).isEqualTo("2025-09-W3");
    }

    @Test
    @DisplayName("특정 주차 인기 Top 5 조회")
    void findTop5ByYearWeek() {
        // Given - 같은 주차에 여러 조회 기록
        String targetWeek = "2025-09-W3";

        // 분석 ID 100: 3회 조회
        historyRepository.save(createHistory(1L, 100L, targetWeek));
        historyRepository.save(createHistory(2L, 100L, targetWeek));
        historyRepository.save(createHistory(3L, 100L, targetWeek));

        // 분석 ID 200: 2회 조회
        historyRepository.save(createHistory(4L, 200L, targetWeek));
        historyRepository.save(createHistory(5L, 200L, targetWeek));

        // 분석 ID 300: 1회 조회
        historyRepository.save(createHistory(6L, 300L, targetWeek));

        // When
        List<Object[]> top5 = historyRepository.findTop5ByYearWeek(targetWeek);

        // Then
        assertThat(top5).hasSize(3);

        // 첫 번째: 분석 ID 100 (3회)
        assertThat(top5.get(0)[0]).isEqualTo(100L);
        assertThat(top5.get(0)[1]).isEqualTo(3L);

        // 두 번째: 분석 ID 200 (2회)
        assertThat(top5.get(1)[0]).isEqualTo(200L);
        assertThat(top5.get(1)[1]).isEqualTo(2L);
    }

    private History createHistory(Long userId, Long companyPositionId, String yearMonthWeek) {
        return History.builder()
                .userId(userId)
                .companyPositionId(companyPositionId)
                .yearMonthWeek(yearMonthWeek)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
