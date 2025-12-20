package com.dongledungle.catching.analysis.controller;

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
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;  // 이것 추가
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
public class AnalysisControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GeminiService geminiService;

    @MockitoBean
    private AnalysisService analysisService;

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

    @Test
    @DisplayName("통합 테스트 - Redis 캐시 히트 시나리오")
    void testAnalysisTextEndpoint_CacheHit() throws Exception {
        // given
        String cachedContent = prompt1Response + prompt2Response + prompt3Response + prompt4Response;
        when(analysisService.getFromRedisCache(anyString(), anyString())).thenReturn(cachedContent);
        when(analysisService.findAnalysisInCurrentWeek(anyString(), anyString()))
                .thenReturn(Optional.of(createAnalysis()));

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

        // Gemini API 호출 안 했는지 검증
        verify(geminiService, never()).analyzeCompanyText1(anyString(), anyString(), nullable(String.class));
    }

    private Analysis createAnalysis() {
        return Analysis.builder()
                .companyPositionId(100L)
                .company("현대오토에버")
                .position("스마트팩토리")
                .content("test content")
                .build();
    }

}
