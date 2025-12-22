package com.dongledungle.catching.analysis.controller;

import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.service.AnalysisService;
import com.dongledungle.catching.analysis.service.AnalysisService.CacheResult;
import com.dongledungle.catching.analysis.service.GeminiService;
import com.google.genai.ResponseStream;
import com.google.genai.types.Candidate;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AnalysisControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GeminiService geminiService;

    @MockitoBean
    private AnalysisService analysisService;

    @MockitoBean
    private com.dongledungle.catching.history.service.HistoryService historyService;

    private String prompt1Response;
    private String prompt2Response;
    private String prompt3Response;
    private String prompt4Response;

    @BeforeEach
    void setUp() {
        prompt1Response = "# 현대오토에버 기본 정보\n현대오토에버는...";
        prompt2Response = "## 현대오토에버 최근 이슈\n### 긍정적 이슈\n...";
        prompt3Response = "# 스마트팩토리 조사 내용\n## 핵심 사업\n...";
        prompt4Response = "## 직무 관련 이슈\n### 긍정적 이슈\n...";
    }

    @Test
    @WithMockCustomUser(userId = "1")
    @DisplayName("통합 테스트 - /api/analysis/text 엔드포인트 성공")
    void testAnalysisTextEndPoint_Success() throws Exception{
        // given
        when(analysisService.getFromRedisCache(anyString(), anyString())).thenReturn(null);
        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString())).thenReturn(Optional.empty());

        // Mock 응답 먼저 생성
        ResponseStream<GenerateContentResponse> stream1 = createMockStream(prompt1Response);
        ResponseStream<GenerateContentResponse> stream2 = createMockStream(prompt2Response);
        ResponseStream<GenerateContentResponse> stream3 = createMockStream(prompt3Response);
        ResponseStream<GenerateContentResponse> stream4 = createMockStream(prompt4Response);

        // doReturn 패턴 사용
        doReturn(stream1).when(geminiService).analyzeCompanyText1(anyString(), anyString(), nullable(String.class));
        doReturn(stream2).when(geminiService).analyzeCompanyText2(anyString(), anyString(), nullable(String.class));
        doReturn(stream3).when(geminiService).analyzeCompanyText3(anyString(), anyString(), anyString(), nullable(String.class));
        doReturn(stream4).when(geminiService).analyzeCompanyText4(anyString(), anyString(), anyString(), nullable(String.class));

        when(analysisService.saveAnalysisToDatabase(anyString(), anyString(), anyString()))
                .thenReturn(123L);

        doNothing().when(historyService).saveHistory(anyLong(), anyLong());

        String requestBody = """
                {
                    "today": "2025-12-20",
                    "company": "현대오토에버",
                    "position": "스마트팩토리",
                    "userId": 1,
                    "analysisDepth": "standard"
                }
                """;

        // when & then
        mockMvc.perform(post("/api/analysis/text")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/event-stream"));
    }

    @Test
    @WithMockCustomUser(userId = "1")
    @DisplayName("통합 테스트 - Redis 캐시 히트 시나리오")
    void testAnalysisTextEndpoint_CacheHit() throws Exception {
        // given
        String cachedContent = prompt1Response + prompt2Response + prompt3Response + prompt4Response;

        // CacheResult 객체 생성 (companyPositionId 포함)
        CacheResult cacheResult = new CacheResult(100L, cachedContent);
        when(analysisService.getFromRedisCache(anyString(), anyString())).thenReturn(cacheResult);

        doNothing().when(historyService).saveHistory(anyLong(), anyLong());

        String requestBody = """
                {
                    "today": "2025-12-20",
                    "company": "현대오토에버",
                    "position": "스마트팩토리",
                    "userId": 1,
                    "analysisDepth": "standard"
                }
                """;

        // when & then
        mockMvc.perform(post("/api/analysis/text")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        // 약간의 대기 시간
        Thread.sleep(500);

        // Gemini API 호출 안 했는지 검증
        verify(geminiService, never()).analyzeCompanyText1(anyString(), anyString(), nullable(String.class));
        verify(geminiService, never()).analyzeCompanyText2(anyString(), anyString(), nullable(String.class));
        verify(geminiService, never()).analyzeCompanyText3(anyString(), anyString(), anyString(), nullable(String.class));
        verify(geminiService, never()).analyzeCompanyText4(anyString(), anyString(), anyString(), nullable(String.class));

        // Redis 캐시 히트 시 DB 조회 안 함
        verify(analysisService, never()).findAnalysisInCurrentWeek(anyString(), anyString());

        // Redis 캐시 히트 시 DB 저장 안 함
        verify(analysisService, never()).saveAnalysisToDatabase(anyString(), anyString(), anyString());
    }

    private ResponseStream<GenerateContentResponse> createMockStream(String content) {
        @SuppressWarnings("unchecked")
        ResponseStream<GenerateContentResponse> mockStream = mock(ResponseStream.class);

        Part mockPart = mock(Part.class);
        doReturn(Optional.of(content)).when(mockPart).text();

        Content mockContent = mock(Content.class);
        doReturn(Optional.of(List.of(mockPart))).when(mockContent).parts();

        Candidate mockCandidate = mock(Candidate.class);
        doReturn(Optional.of(mockContent)).when(mockCandidate).content();

        GenerateContentResponse mockResponse = mock(GenerateContentResponse.class);
        doReturn(Optional.of(List.of(mockCandidate))).when(mockResponse).candidates();

        doReturn(List.of(mockResponse).iterator()).when(mockStream).iterator();

        return mockStream;
    }

    private Analysis createAnalysis() {
        return Analysis.builder()
                .companyPositionId(100L)
                .company("현대오토에버")
                .position("스마트팩토리")
                .content("test content")
                .build();
    }

    // 커스텀 어노테이션 정의
    @Retention(RetentionPolicy.RUNTIME)
    @WithSecurityContext(factory = WithMockCustomUserSecurityContextFactory.class)
    public @interface WithMockCustomUser {
        String userId() default "1";
    }

    // SecurityContext Factory 구현
    public static class WithMockCustomUserSecurityContextFactory
            implements WithSecurityContextFactory<WithMockCustomUser> {

        @Override
        public SecurityContext createSecurityContext(WithMockCustomUser annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();

            // Principal을 String(userId)로 직접 설정
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            annotation.userId(),  // principal을 String으로 설정
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );

            context.setAuthentication(authentication);
            return context;
        }
    }
}