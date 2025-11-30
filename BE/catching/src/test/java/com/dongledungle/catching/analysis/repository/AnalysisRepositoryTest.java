package com.dongledungle.catching.analysis.repository;

import com.dongledungle.catching.analysis.entity.Analysis;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDateTime;

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


}