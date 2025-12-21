package com.dongledungle.catching.analysis.util;

import com.dongledungle.catching.common.util.WeekUtil;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("WeekUtil 주차 계산 테스트")
public class WeekUtilTest {
    @Test
    @DisplayName("월별 주차 계산")
    void calculateYearMonthWeek(){
        // Given
        LocalDateTime sept1 = LocalDateTime.of(2025, 9, 1, 10, 0);
        LocalDateTime sept15 = LocalDateTime.of(2025, 9, 15, 10, 0);
        LocalDateTime sept25 = LocalDateTime.of(2025, 9, 25, 10, 0);

        // When
        String week1 = WeekUtil.getYearMonthWeek(sept1);
        String week3 = WeekUtil.getYearMonthWeek(sept15);
        String week4 = WeekUtil.getYearMonthWeek(sept25);

        // Then
        assertThat(week1).startsWith("2025-09-W");
        assertThat(week3).startsWith("2025-09-W");
        assertThat(week4).startsWith("2025-09-W");

        // 주차 번호 검증
        assertThat(week1).matches("2025-09-W[0-1]");  // 0 or 1주차
        assertThat(week3).matches("2025-09-W[2-3]");  // 2 or 3주차
        assertThat(week4).matches("2025-09-W[3-4]");  // 3 or 4주차
    }

    @Test
    @DisplayName("주의 시작일(월요일) 계산")
    void getWeekStart() {
        // Given - 수요일
        LocalDateTime wednesday = LocalDateTime.of(2025, 12, 3, 15, 30);

        // When
        LocalDateTime weekStart = WeekUtil.getWeekStart(wednesday);

        // Then - 이번 주 월요일 00:00:00
        assertThat(weekStart.getDayOfWeek().name()).isEqualTo("MONDAY");
        assertThat(weekStart.getHour()).isEqualTo(0);
        assertThat(weekStart.getMinute()).isEqualTo(0);
        assertThat(weekStart.getSecond()).isEqualTo(0);
    }

    @Test
    @DisplayName("주의 종료일(다음 주 월요일) 계산")
    void getWeekEnd() {
        // Given
        LocalDateTime someDay = LocalDateTime.of(2025, 12, 3, 10, 0);

        // When
        LocalDateTime weekStart = WeekUtil.getWeekStart(someDay);
        LocalDateTime weekEnd = WeekUtil.getWeekEnd(someDay);

        // Then - 정확히 7일 차이
        assertThat(weekEnd).isEqualTo(weekStart.plusWeeks(1));
    }
}
