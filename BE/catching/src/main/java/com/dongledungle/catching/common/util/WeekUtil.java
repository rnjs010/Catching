package com.dongledungle.catching.common.util;


import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.Locale;

public class WeekUtil {
    /**
     * 월별 주차 문자열 생성 (예: "2025-09-W3")
     * 해당 월의 첫 번째 월요일부터 1주차로 계산
     */
    public static String getYearMonthWeek(LocalDateTime dateTime){
        int year = dateTime.getYear();
        int month = dateTime.getMonthValue();
        int weekOfMonth = getWeekOfMonth(dateTime);

        return String.format("%d-%02d-W%d", year, month, weekOfMonth);
    }

    /**
     * 해당 월의 몇 번째 주인지 계산
     * 월의 첫 번째 월요일부터 1주차 시작
     */
    public static int getWeekOfMonth(LocalDateTime dateTime) {
        LocalDate date = dateTime.toLocalDate();

        // 해당 월의 1일
        LocalDate firstDayOfMonth = date.withDayOfMonth(1);

        // 해당 월의 첫 번째 월요일 찾기
        LocalDate firstMonday = firstDayOfMonth.with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));

        // 현재 날짜가 첫 번째 월요일보다 이전이면 0주차 (이전 달로 간주)
        if (date.isBefore(firstMonday)) {
            return 0;  // 또는 이전 달의 마지막 주로 처리
        }

        // 첫 번째 월요일부터 현재까지 몇 주 지났는지 계산
        long daysDiff = ChronoUnit.DAYS.between(firstMonday, date);
        int weekOfMonth = (int) (daysDiff / 7) + 1;

        return weekOfMonth;
    }

    /**
     * 해당 주의 시작일 (월요일 00:00:00)
     */
    public static LocalDateTime getWeekStart(LocalDateTime dateTime) {
        return dateTime
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .truncatedTo(ChronoUnit.DAYS);
    }

    /**
     * 해당 주의 종료일 (다음 주 월요일 00:00:00)
     */
    public static LocalDateTime getWeekEnd(LocalDateTime dateTime) {
        return getWeekStart(dateTime).plusWeeks(1);
    }

    /**
     * 현재 월별 주차 문자열
     */
    public static String getCurrentYearMonthWeek() {
        return getYearMonthWeek(LocalDateTime.now());
    }
}
