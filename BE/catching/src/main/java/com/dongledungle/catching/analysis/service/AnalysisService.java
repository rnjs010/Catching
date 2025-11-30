package com.dongledungle.catching.analysis.service;

import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.repository.AnalysisRepository;
import com.dongledungle.catching.common.util.WeekUtil;
import com.dongledungle.catching.history.entity.History;
import com.dongledungle.catching.history.repository.HistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {
    private final AnalysisRepository analysisRepository;
    private final HistoryRepository historyRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String REDIS_KEY_PREFIX = "analysis:";
    private static final Duration REDIS_TIL = Duration.ofDays(7); // 일주일 캐시

    /**
     * redis 조회
     */
    public String getFromRedisCache(String company, String position){
        String key = generateRedisKey(company, position);
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * redis 저장
     */
    public void saveToRedisCache(String company, String position, String content){
        String key = generateRedisKey(company, position);
        redisTemplate.opsForValue().set(key, content, REDIS_TIL);
    }

    /**
     * DB에서 주에 생성된 결과 조회
     */
    public Optional<Analysis> findAnalysisInCurrentWeek(String company, String position){
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekStart = WeekUtil.getWeekStart(now);
        LocalDateTime weekEnd = WeekUtil.getWeekEnd(now);

        return analysisRepository.findByCompanyAndPositionInWeek(
                company, position, weekStart, weekEnd
        );
    }

    /**
     * db에 분석 결과 저장
     */
    @Transactional
    public Long saveAnalysisToDatabase(String company, String position, String analysisJson){
        Analysis entity = Analysis.builder()
                .company(company)
                .position(position)
                .content(analysisJson)
                .createdAt(LocalDateTime.now())
                .build();

        Analysis saved = analysisRepository.save(entity);
        log.info("DB 저장 완료: ID={}, 회사={}, 직무={}", saved.getCompanyPositionId(), company, position);

        return saved.getCompanyPositionId();
    }

    /**
     * 사용자 조회 기록 저장
     */
    @Transactional
    public void saveHistory(Long userId, Long companyPositionId){
        String currentMonthWeek = WeekUtil.getCurrentYearMonthWeek();

        // 조회 기록 저장
        History history = History.builder()
                .userId(userId)
                .companyPositionId(companyPositionId)
                .yearMonthWeek(currentMonthWeek)
                .createdAt(LocalDateTime.now())
                .build();

        historyRepository.save(history);
        log.info("History 저장: userId={}, companyPositionId={}, week={}",
                userId, companyPositionId, currentMonthWeek);
    }

    private String generateRedisKey(String company, String position) {
        return REDIS_KEY_PREFIX+company+":"+position;
    }
}
