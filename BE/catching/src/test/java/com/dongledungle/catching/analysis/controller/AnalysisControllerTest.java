package com.dongledungle.catching.analysis.controller;

import com.dongledungle.catching.analysis.dto.AnalysisRequestDto;
import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.service.AnalysisService;
import com.dongledungle.catching.analysis.service.GeminiService;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalysisControllerTest {

    @Mock
    private GeminiService geminiService;

    @Mock
    private AnalysisService analysisService;

    @InjectMocks
    private AnalysisController analysisController;

    private AnalysisRequestDto request;
    private String prompt1Response;
    private String prompt2Response;
    private String prompt3Response;
    private String prompt4Response;

    @BeforeEach
    void setUp() {
        request = AnalysisRequestDto.builder()
                .today(LocalDate.now().toString())
                .company("현대오토에버")
                .position("스마트팩토리")
                .userId(1L)
                .build();

        // 각 프롬프트 응답 설정 (실제 마크다운 형식)
        prompt1Response = """
                # 현대오토에버 기본 정보
                현대오토에버는 현대자동차그룹의 소프트웨어 전문 기업입니다.
                
                ### 기업 현황
                - 설립연도: 2000년 4월
                - 본사위치: 서울특별시 강남구
                """;

        prompt2Response = """
                ## 현대오토에버 최근 이슈
                ### 긍정적 이슈
                **3분기 역대 최고 실적 달성**
                날짜: 2025-12-10
                """;

        prompt3Response = """
                # 현대오토에버 스마트팩토리 조사 내용
                ## 핵심 사업
                ### 소프트웨어 정의 공장(SDF) 솔루션
                """;

        prompt4Response = """
                ## 직무 관련 이슈
                ### 긍정적 이슈
                **네오팩토리 솔루션 공략 가속화**
                """;
    }

    @Test
    @DisplayName("Redis 캐시 히트 - AI API 호출 X")
    void testRedisCache_Hit() throws Exception {
        // given
        String cachedContent = prompt1Response + prompt2Response + prompt3Response + prompt4Response;

        when(analysisService.getFromRedisCache(anyString(), anyString()))
                .thenReturn(cachedContent);

        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString()))
                .thenReturn(Optional.of(createMockAnalysis(cachedContent)));

        // when
        SseEmitter emitter = analysisController.analyzeText(request);
        Thread.sleep(500);

        // then
        verify(analysisService, times(1)).getFromRedisCache("현대오토에버", "스마트팩토리");
        verify(geminiService, never()).analyzeCompanyText1(any(), anyString(), anyString());
        verify(geminiService, never()).analyzeCompanyText2(any(), anyString(), anyString());
        verify(geminiService, never()).analyzeCompanyText3(any(), anyString(), anyString(), anyString());
        verify(geminiService, never()).analyzeCompanyText4(any(), anyString(), anyString(), anyString());

        // saveHistory 호출 횟수 : 1회
        verify(analysisService, times(1)).saveHistory(eq(1L), anyLong());

        assertThat(emitter).isNotNull();
    }

    private Analysis createMockAnalysis(String content) {
        return Analysis.builder()
                .companyPositionId(100L)
                .company("현대오토에버")
                .position("스마트팩토리")
                .content(content)
                .build();
    }

}