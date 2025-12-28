package com.dongledungle.catching.analysis.service;

import com.dongledungle.catching.analysis.dto.AnalysisDetailResponseDto;
import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.repository.AnalysisRepository;
import com.dongledungle.catching.common.util.WeekUtil;
import com.dongledungle.catching.history.entity.History;
import com.dongledungle.catching.history.repository.HistoryRepository;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {
    private final AnalysisRepository analysisRepository;
    private final HistoryRepository historyRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final Gson gson = new Gson();

    private static final String REDIS_KEY_PREFIX = "analysis:";
//    private static final Duration REDIS_TIL = Duration.ofDays(7); // 일주일 캐시

    /**
     * Redis 캐시 결과를 담는 DTO
     */
    public record CacheResult(Long companyPositionId, String content) {}

    /**
     * redis 조회
     */
    public CacheResult getFromRedisCache(String company, String position){
        String key = generateRedisKey(company, position);
        String cached = redisTemplate.opsForValue().get(key);

        if (cached == null) {
            return null;
        }

        try {
            JsonObject cacheData = gson.fromJson(cached, JsonObject.class);
            Long companyPositionId = cacheData.get("companyPositionId").getAsLong();
            String content = cacheData.get("content").getAsString();

            return new CacheResult(companyPositionId, content);
        } catch (Exception e) {
            log.error("Redis 캐시 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * redis 저장
     */
    public void saveToRedisCache(String company, String position, String content, Long companyPositionId){
        String key = generateRedisKey(company, position);
        Duration ttl = calculateTtlUntilWeekEnd();

        // JSON 형태로 ID와 content를 함께 저장
        JsonObject cacheData = new JsonObject();
        cacheData.addProperty("companyPositionId", companyPositionId);
        cacheData.addProperty("content", content);

        redisTemplate.opsForValue().set(key, gson.toJson(cacheData), ttl);
        log.info("Redis 캐시 저장 완료: key={}, TTL={}분", key, ttl.toMinutes());
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
     * 분석 ID로 Content 조회하기
     */
    public AnalysisDetailResponseDto getAnalysisDetail(Long companyPositionId){
        Analysis analysis = analysisRepository.findById(companyPositionId)
                .orElseThrow(() -> new NoSuchElementException("분석 정보를 찾을 수 없습니다."));

        return AnalysisDetailResponseDto.builder()
                .company(analysis.getCompany())
                .position(analysis.getPosition())
                .content(analysis.getContent())
                .createdAt(analysis.getCreatedAt())
                .build();
    }

    private String generateRedisKey(String company, String position) {
        return REDIS_KEY_PREFIX+company+":"+position;
    }

    private Duration calculateTtlUntilWeekEnd(){
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekEnd = WeekUtil.getWeekEnd(now);

        Duration duration = Duration.between(now, weekEnd);

        // 이번 주가 1분도 안남았을 경우 1분은 보장
        if(duration.toMinutes()<1){
            return Duration.ofMinutes(1);
        }

        return duration;
    }
}
