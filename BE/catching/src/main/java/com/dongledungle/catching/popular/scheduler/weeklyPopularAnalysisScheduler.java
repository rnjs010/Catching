package com.dongledungle.catching.popular.scheduler;

import com.dongledungle.catching.common.util.WeekUtil;
import com.dongledungle.catching.history.repository.HistoryRepository;
import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class weeklyPopularAnalysisScheduler {
    private final HistoryRepository historyRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final Gson gson = new Gson();

    /**
     * 매주 월요일 새벽 3시에 실행
     * 지난 주 인기 분석 Top 5를 Redis에 저장
     */
    @Scheduled(cron = "0 0 3 * * MON")
    public void updateWeeklyPopularAnalysis() {
        try {
            // 1. 지난 주 주차 계산
            String lastWeek = WeekUtil.getYearMonthWeek(LocalDateTime.now().minusWeeks(1));

            // 2. History에서 지난 주 Top 5 조회
            List<Object[]> top5 = historyRepository.findTop5ByYearWeek(lastWeek);

            if (top5.isEmpty()) {
                log.warn("{}주차 History 데이터 없음", lastWeek);
                return;
            }

            // 3. company_position_id만 추출
            List<Long> top5Ids = top5.stream()
                    .map(arr -> (Long) arr[0])  // [0]: company_position_id
                    .toList();

            // 4. Redis에 저장
            String redisKey = "popular:weekly:" + lastWeek;
            String jsonIds = gson.toJson(top5Ids);

            redisTemplate.opsForValue().set(
                    redisKey,
                    jsonIds,
                    Duration.ofDays(90)  // 90일 보관 (약 13주)
            );

            // 조회수도 로그에 출력
            for (int i = 0; i < top5.size(); i++) {
                Long id = (Long) top5.get(i)[0];
                Long count = (Long) top5.get(i)[1];
                log.info("{}위: ID={}, 조회수={}", i + 1, id, count);
            }

        } catch (Exception e) {
            log.error("주간 인기 분석 집계 실패", e);
        }

        log.info("===== 주간 인기 분석 집계 종료 =====");
    }

    /**
     * 테스트용: 즉시 실행 (수동 트리거)
     * 실제 운영에서는 주석 처리하거나 삭제
     */
    // @Scheduled(fixedDelay = Long.MAX_VALUE)  // 애플리케이션 시작 시 1회만 실행
    public void testScheduler() {
        log.info("테스트 스케줄러 실행");
        updateWeeklyPopularAnalysis();
    }

}
