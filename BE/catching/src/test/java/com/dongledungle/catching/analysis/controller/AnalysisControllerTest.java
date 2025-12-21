package com.dongledungle.catching.analysis.controller;

import com.dongledungle.catching.analysis.dto.AnalysisRequestDto;
import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.service.AnalysisService;
import com.dongledungle.catching.analysis.service.GeminiService;
import com.google.genai.ResponseStream;
import com.google.genai.types.Candidate;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
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
                .analysisDepth("standard")
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

    @Test
    @DisplayName("Redis 미스, DB 히트 - AI API 호출 X, Redis에 저장")
    void testDatabaseCache_Hit() throws Exception{
        // given
        String dbContent = prompt1Response + prompt2Response + prompt3Response + prompt4Response;
        when(analysisService.getFromRedisCache(anyString(), anyString()))
                .thenReturn(null); // Redis 미스

        Analysis mockAnalysis = createMockAnalysis(dbContent);
        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString()))
                .thenReturn(Optional.of(mockAnalysis));

        // when
        SseEmitter emitter = analysisController.analyzeText(request);
        Thread.sleep(500);

        // then
        verify(analysisService, times(1)).getFromRedisCache("현대오토에버", "스마트팩토리");
        verify(analysisService, times(1)).findAnalysisInCurrentWeek("현대오토에버", "스마트팩토리");
        verify(geminiService, never()).analyzeCompanyText1(any(), anyString(), anyString());
        verify(geminiService, never()).analyzeCompanyText2(any(), anyString(), anyString());
        verify(geminiService, never()).analyzeCompanyText3(any(), anyString(), anyString(), anyString());
        verify(geminiService, never()).analyzeCompanyText4(any(), anyString(), anyString(), anyString());

        // Redis에 저장했는지 확인
        verify(analysisService, times(1))
                .saveToRedisCache(eq("현대오토에버"), eq("스마트팩토리"), anyString());
        verify(analysisService, times(1)).saveHistory(eq(1L), eq(mockAnalysis.getCompanyPositionId()));
        assertThat(emitter).isNotNull();
    }

    /**
     * 실제 AI API 호출이 아닌 가짜 응답을 만들어서 실제 API 호출된 것 처럼 시뮬레이션(AI API의 중첩된 응답 구조를 Mock으로 재현)
     */
    @Test
    @DisplayName("Redis, DB 모두 미스 - AI API 프롬프트 호출")
    void testCache_Miss_CallAllAiPrompts() throws Exception{
        // given
        when(analysisService.getFromRedisCache(anyString(), anyString())).thenReturn(null);
        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString())).thenReturn(Optional.empty());
        // 4개 프롬프트 모킹
        ResponseStream<GenerateContentResponse> stream1 = createMockResponseStream(prompt1Response);
        ResponseStream<GenerateContentResponse> stream2 = createMockResponseStream(prompt2Response);
        ResponseStream<GenerateContentResponse> stream3 = createMockResponseStream(prompt3Response);
        ResponseStream<GenerateContentResponse> stream4 = createMockResponseStream(prompt4Response);

        // geminiService의 4개 메서드가 호출되면 위의 가짜 스트림 반환
        when(geminiService.analyzeCompanyText1(anyString(), eq("현대오토에버"), eq("standard")))
                .thenReturn(stream1); // 프롬프트1 호출 시 stream1 반환
        when(geminiService.analyzeCompanyText2(anyString(), eq("현대오토에버"), eq("standard")))
                .thenReturn(stream2); // 프롬프트2 호출 시 stream2 반환
        when(geminiService.analyzeCompanyText3(anyString(), eq("현대오토에버"), eq("스마트팩토리"), eq("standard")))
                .thenReturn(stream3);
        when(geminiService.analyzeCompanyText4(anyString(), eq("현대오토에버"), eq("스마트팩토리"), eq("standard")))
                .thenReturn(stream4);
        // db 저장 메서드가 호출되면 id 123 반환
        when(analysisService.saveAnalysisToDatabase(anyString(), anyString(), anyString()))
                .thenReturn(123L);

        // when
        SseEmitter emitter = analysisController.analyzeText(request);
        Thread.sleep(2000); // 병렬 처리 대기

        // then
        // 각 프롬프트가 1번씩 호출되었는지 확인
        verify(geminiService, times(1)).analyzeCompanyText1(anyString(), eq("현대오토에버"), eq("standard"));
        verify(geminiService, times(1)).analyzeCompanyText2(anyString(), eq("현대오토에버"), eq("standard"));
        verify(geminiService, times(1)).analyzeCompanyText3(anyString(), eq("현대오토에버"), eq("스마트팩토리"), eq("standard"));
        verify(geminiService, times(1)).analyzeCompanyText4(anyString(), eq("현대오토에버"), eq("스마트팩토리"), eq("standard"));

        // db 저장, redis저장, history 저장도 1번씩 호출되었는지 확인
        verify(analysisService, times(1))
                .saveAnalysisToDatabase(eq("현대오토에버"), eq("스마트팩토리"), anyString());
        verify(analysisService, times(1))
                .saveToRedisCache(eq("현대오토에버"), eq("스마트팩토리"), anyString());
        verify(analysisService, times(1)).saveHistory(eq(1L), eq(123L));

        assertThat(emitter).isNotNull();
    }

    // ========== 재시도 로직 테스트 (개별 프롬프트) ==========
    @Test
    @DisplayName("프롬프트1 실패 후 재시도 성공")
    void testPrompt1_RetrySuccessOnSecondAttempt() throws Exception {
        // given
        when(analysisService.getFromRedisCache(anyString(), anyString())).thenReturn(null);
        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString())).thenReturn(Optional.empty());

        // Mock 응답을 먼저 모두 생성 (여기서 생성!)
        ResponseStream<GenerateContentResponse> stream1Success = createMockResponseStream(prompt1Response);
        ResponseStream<GenerateContentResponse> stream2 = createMockResponseStream(prompt2Response);
        ResponseStream<GenerateContentResponse> stream3 = createMockResponseStream(prompt3Response);
        ResponseStream<GenerateContentResponse> stream4 = createMockResponseStream(prompt4Response);

        // 프롬프트1: 첫 번째 실패, 두 번째 성공
        doThrow(new RuntimeException("API 오류"))
                .doReturn(stream1Success)  // 이미 생성된 객체 사용
                .when(geminiService).analyzeCompanyText1(anyString(), anyString(), anyString());

        // 나머지 프롬프트는 정상
        doReturn(stream2)
                .when(geminiService).analyzeCompanyText2(anyString(), anyString(), anyString());
        doReturn(stream3)
                .when(geminiService).analyzeCompanyText3(anyString(), anyString(), anyString(), anyString());
        doReturn(stream4)
                .when(geminiService).analyzeCompanyText4(anyString(), anyString(), anyString(), anyString());

        when(analysisService.saveAnalysisToDatabase(anyString(), anyString(), anyString()))
                .thenReturn(123L);

        // when
        SseEmitter emitter = analysisController.analyzeText(request);
        Thread.sleep(3000);

        // then
        verify(geminiService, times(2)).analyzeCompanyText1(anyString(), anyString(), anyString());
        verify(analysisService, times(1)).saveAnalysisToDatabase(anyString(), anyString(), anyString());

        assertThat(emitter).isNotNull();
    }

    @Test
    @DisplayName("프롬프트2 2번 연속 실패 - 부분 실패 허용하고 빈 문자열로 처리")
    void testPrompt2_FailureAfterMaxRetries() throws Exception {
        // given
        when(analysisService.getFromRedisCache(anyString(), anyString())).thenReturn(null);
        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString())).thenReturn(Optional.empty());
        // Mock 응답을 먼저 모두 생성
        ResponseStream<GenerateContentResponse> stream1 = createMockResponseStream(prompt1Response);
        ResponseStream<GenerateContentResponse> stream3 = createMockResponseStream(prompt3Response);
        ResponseStream<GenerateContentResponse> stream4 = createMockResponseStream(prompt4Response);

        doReturn(stream1)
                .when(geminiService).analyzeCompanyText1(anyString(), anyString(), anyString());
        // 프롬프트2: 2번 연속 실패
        doThrow(new RuntimeException("API 오류 1"))
                .doThrow(new RuntimeException("API 오류 2"))
                .when(geminiService).analyzeCompanyText2(anyString(), anyString(), anyString());

        doReturn(stream3)
                .when(geminiService).analyzeCompanyText3(anyString(), anyString(), anyString(), anyString());
        doReturn(stream4)
                .when(geminiService).analyzeCompanyText4(anyString(), anyString(), anyString(), anyString());
        // when
        SseEmitter emitter = analysisController.analyzeText(request);
        Thread.sleep(4000); // 재시도 2번 + 병렬 처리

        // then
        verify(geminiService, times(2)).analyzeCompanyText2(any(), anyString(), anyString());
        // 부분 실패로 전체 저장 안 됨
        verify(analysisService, never()).saveAnalysisToDatabase(anyString(), anyString(), anyString());

        assertThat(emitter).isNotNull();
    }

    @Test
    @DisplayName("프롬프트3, 4 동시 실패 후 재시도 성공")
    void testMultiplePrompts_RetrySuccess() throws Exception {
        // given
        when(analysisService.getFromRedisCache(anyString(), anyString())).thenReturn(null);
        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString())).thenReturn(Optional.empty());
        // Mock 응답을 먼저 모두 생성
        ResponseStream<GenerateContentResponse> stream1 = createMockResponseStream(prompt1Response);
        ResponseStream<GenerateContentResponse> stream2 = createMockResponseStream(prompt2Response);
        ResponseStream<GenerateContentResponse> stream3 = createMockResponseStream(prompt3Response);
        ResponseStream<GenerateContentResponse> stream4 = createMockResponseStream(prompt4Response);

        doReturn(stream1)
                .when(geminiService).analyzeCompanyText1(anyString(), anyString(), anyString());
        doReturn(stream2)
                .when(geminiService).analyzeCompanyText2(anyString(), anyString(), anyString());
        // 프롬프트3: 첫 시도 실패, 두 번째 성공
        doThrow(new RuntimeException("API 오류"))
                .doReturn(stream3)  // 이미 생성된 객체 사용
                .when(geminiService).analyzeCompanyText3(anyString(), anyString(), anyString(), anyString());

        // 프롬프트4: 첫 시도 실패, 두 번째 성공
        doThrow(new RuntimeException("API 오류"))
                .doReturn(stream4)  // 이미 생성된 객체 사용
                .when(geminiService).analyzeCompanyText4(anyString(), anyString(), anyString(), anyString());

        when(analysisService.saveAnalysisToDatabase(anyString(), anyString(), anyString()))
                .thenReturn(123L);

        // when
        SseEmitter emitter = analysisController.analyzeText(request);
        Thread.sleep(3000);

        // then
        verify(geminiService, times(2)).analyzeCompanyText3(anyString(), anyString(), anyString(), anyString());
        verify(geminiService, times(2)).analyzeCompanyText4(anyString(), anyString(), anyString(), anyString());
        verify(analysisService, times(1)).saveAnalysisToDatabase(anyString(), anyString(), anyString());

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

    private ResponseStream<GenerateContentResponse> createMockResponseStream(String content) {
        List<String> chunks = List.of(
                content.substring(0, Math.min(content.length() / 2, content.length())),
                content.substring(Math.min(content.length() / 2, content.length()))
        );

        @SuppressWarnings("unchecked")
        ResponseStream<GenerateContentResponse> mockStream = mock(ResponseStream.class);

        // 각 청크에 대한 응답 생성 - doReturn().when() 패턴 사용
        List<GenerateContentResponse> responses = chunks.stream()
                .map(chunk -> {
                    Part mockPart = mock(Part.class);
                    // when().thenReturn() 대신 doReturn().when() 사용(중첩된 Mock을 만들 때는 문제해결을 위함)
                    doReturn(Optional.of(chunk)).when(mockPart).text();

                    Content mockContent = mock(Content.class);
                    doReturn(Optional.of(List.of(mockPart))).when(mockContent).parts();

                    Candidate mockCandidate = mock(Candidate.class);
                    doReturn(Optional.of(mockContent)).when(mockCandidate).content();

                    GenerateContentResponse mockResponse = mock(GenerateContentResponse.class);
                    doReturn(Optional.of(List.of(mockCandidate))).when(mockResponse).candidates();

                    return mockResponse;
                })
                .toList();

        // iterator() 메서드 모킹도 doReturn 사용
        doReturn(responses.iterator()).when(mockStream).iterator();

        return mockStream;
    }
}