package com.dongledungle.catching.analysis.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class RateLimitService {

    // 사용자별 마지막 요청 시간
    private final Map<Long, Instant> userLastRequestTime = new ConcurrentHashMap<>();

    // 분석 진행 중 상태 (userId:company:position -> 시작 시간)
    private final Map<String, Instant> processingAnalysis = new ConcurrentHashMap<>();

    private static final long COOLDOWN_SECONDS = 50; // 50초 제한
    private static final long PROCESSING_TIMEOUT_MINUTES = 10; // 처리 중 타임아웃

    private final ScheduledExecutorService cleanupScheduler;

    public RateLimitService() {
        // 주기적으로 만료된 데이터 정리 (1분마다)
        this.cleanupScheduler = Executors.newSingleThreadScheduledExecutor();
        this.cleanupScheduler.scheduleAtFixedRate(
                this::cleanupExpiredEntries,
                1, 1, TimeUnit.MINUTES
        );
    }

    /**
     * 사용자별 요청 제한 체크
     */
    public boolean isUserAllowed(Long userId) {
        Instant now = Instant.now();
        Instant lastRequest = userLastRequestTime.get(userId);

        if (lastRequest != null) {
            long secondsSinceLastRequest = now.getEpochSecond() - lastRequest.getEpochSecond();

            if (secondsSinceLastRequest < COOLDOWN_SECONDS) {
                log.warn("Rate limit exceeded for user: {} ({}초 경과)", userId, secondsSinceLastRequest);
                return false;
            }
        }

        // 새 요청 허용 및 쿨다운 시작
        userLastRequestTime.put(userId, now);
        log.debug("Rate limit set for user: {} at {}", userId, now);
        return true;
    }

    /**
     * 남은 쿨다운 시간 조회
     */
    public Long getRemainingTime(Long userId) {
        Instant lastRequest = userLastRequestTime.get(userId);

        if (lastRequest == null) {
            return 0L;
        }

        Instant now = Instant.now();
        long elapsed = now.getEpochSecond() - lastRequest.getEpochSecond();
        long remaining = COOLDOWN_SECONDS - elapsed;

        return Math.max(0L, remaining);
    }

    /**
     * 특정 사용자의 분석이 이미 처리 중인지 체크
     */
    public boolean isAnalysisProcessing(Long userId, String company, String position) {
        String key = makeKey(userId, company, position);
        Instant processingStart = processingAnalysis.get(key);

        if (processingStart == null) {
            return false;
        }

        // 타임아웃 체크 (10분 이상 지났으면 만료 처리)
        Instant now = Instant.now();
        long minutesElapsed = (now.getEpochSecond() - processingStart.getEpochSecond()) / 60;

        if (minutesElapsed >= PROCESSING_TIMEOUT_MINUTES) {
            log.warn("Processing timeout for user: {}, {} - {}, removing lock", userId, company, position);
            processingAnalysis.remove(key);
            return false;
        }

        log.warn("Analysis already processing for user: {}, {} - {}", userId, company, position);
        return true;
    }

    /**
     * 분석 처리 중 상태 설정
     */
    public void markAsProcessing(Long userId, String company, String position) {
        String key = makeKey(userId, company, position);
        processingAnalysis.put(key, Instant.now());
        log.debug("Marked as processing: user={}, {} - {}", userId, company, position);
    }

    /**
     * 분석 처리 중 상태 해제
     */
    public void unmarkAsProcessing(Long userId, String company, String position) {
        String key = makeKey(userId, company, position);
        processingAnalysis.remove(key);
        log.debug("Unmarked processing: user={}, {} - {}", userId, company, position);
    }

    /**
     * 수동으로 쿨다운 해제 (관리자용 등)
     */
    public void resetUserCooldown(Long userId) {
        userLastRequestTime.remove(userId);
        log.info("User cooldown reset: {}", userId);
    }

    /**
     * 만료된 항목 정리 (메모리 누수 방지)
     */
    private void cleanupExpiredEntries() {
        try {
            Instant now = Instant.now();

            // 만료된 사용자 쿨다운 제거
            userLastRequestTime.entrySet().removeIf(entry -> {
                long elapsed = now.getEpochSecond() - entry.getValue().getEpochSecond();
                return elapsed > COOLDOWN_SECONDS * 2; // 여유있게 2배 시간 지나면 제거
            });

            // 만료된 처리 중 상태 제거
            processingAnalysis.entrySet().removeIf(entry -> {
                long minutesElapsed = (now.getEpochSecond() - entry.getValue().getEpochSecond()) / 60;
                return minutesElapsed >= PROCESSING_TIMEOUT_MINUTES;
            });

            log.debug("Cleanup completed. Users: {}, Processing: {}",
                    userLastRequestTime.size(), processingAnalysis.size());

        } catch (Exception e) {
            log.error("Error during cleanup", e);
        }
    }

    /**
     * userId-회사-직무 키 생성
     */
    private String makeKey(Long userId, String company, String position) {
        return userId + ":" + company + ":" + position;
    }

    /**
     * 현재 상태 조회 (모니터링용)
     */
    public Map<String, Object> getStatus() {
        return Map.of(
                "activeUsers", userLastRequestTime.size(),
                "processingAnalysis", processingAnalysis.size()
        );
    }
}