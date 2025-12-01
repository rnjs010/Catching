package com.dongledungle.catching.analysis.repository;

import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.common.util.WeekUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest  // JPA 레이어만 테스트
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)  // 실제 DB 사용
@DisplayName("AnalysisRepository 통합 테스트")
class AnalysisRepositoryTest {
    @Autowired
    private AnalysisRepository analysisRepository;

    @Test
    @DisplayName("분석 데이터 저장 및 조회")
    void saveAndFind() {
        // Given
        Analysis entity = Analysis.builder()
                .company("삼성SDS")
                .position("스마트팩토리")
                .content("{\"test\":\"data\"}")
                .createdAt(LocalDateTime.now())
                .build();

        // When
        Analysis saved = analysisRepository.save(entity);
        Analysis found = analysisRepository.findById(saved.getCompanyPositionId()).orElseThrow();

        // Then
        assertThat(found.getCompany()).isEqualTo("삼성SDS");
        assertThat(found.getContent()).isEqualTo("{\"test\":\"data\"}");
    }

    @Test
    @DisplayName("이번 주에 생성된 분석 조회")
    void findAnalysisInCurrentWeek(){
        // Given - 이번 주 데이터
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekStart = WeekUtil.getWeekStart(now);
        LocalDateTime weekEnd = WeekUtil.getWeekEnd(now);

        Analysis thisWeek = Analysis.builder()
                .company("현대오토에버")
                .position("스마트팩토리")
                .content("{\"current\":\"week\"}")
                .createdAt(now)
                .build();
        analysisRepository.save(thisWeek);

        // Given - 지난 주 데이터
        Analysis lastWeek = Analysis.builder()
                .company("현대오토에버")
                .position("스마트팩토리")
                .content("{\"last\":\"week\"}")
                .createdAt(now.minusWeeks(1))
                .build();
        analysisRepository.save(lastWeek);

        // When - 이번 주 조회
        Optional<Analysis> found = analysisRepository.findByCompanyAndPositionInWeek(
                "현대오토에버", "스마트팩토리", weekStart, weekEnd
        );

        // Then - 이번 주 데이터만 조회됨
        assertThat(found).isPresent();
        assertThat(found.get().getContent()).isEqualTo("{\"current\":\"week\"}");
    }

    @Test
    @DisplayName("회사-직무로 모든 분석 조회")
    void findByCompanyAndPosition() {
        // Given
        analysisRepository.save(Analysis.builder()
                .company("카카오")
                .position("프론트엔드")
                .content("{\"data1\":\"test\"}")
                .createdAt(LocalDateTime.now())
                .build());

        analysisRepository.save(Analysis.builder()
                .company("카카오")
                .position("프론트엔드")
                .content("{\"data2\":\"test\"}")
                .createdAt(LocalDateTime.now().minusDays(7))
                .build());

        // When
        var results = analysisRepository.findByCompanyAndPosition("카카오", "프론트엔드");

        // Then
        assertThat(results).hasSize(2);
    }
}