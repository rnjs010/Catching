package com.dongledungle.catching.analysis.service;

import com.google.common.collect.ImmutableList;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("classpath:prompts/prompt-company-position-search.st")
    private Resource companyPositionSearchPromptResource;

    @Value("classpath:prompts/prompt1.st")
    private Resource prompt1;

    @Value("classpath:prompts/prompt2.st")
    private Resource prompt2;

    @Value("classpath:prompts/prompt3.st")
    private Resource prompt3;

    @Value("classpath:prompts/prompt4.st")
    private Resource prompt4;

    private final Gson gson = new Gson();
    private static final String MODEL = "gemini-2.5-flash";

    // ============ Public API ============

    /**
     * JSON 형식으로 응답하는 AI API 호출
     */
    public ResponseStream<GenerateContentResponse> analyzeCompany(String today, String company,
                                                                  String position, String analysisDepth) {
        return generateContent(
                loadPrompt(companyPositionSearchPromptResource),
                Map.of("today", today, "company", company, "position", position, "analysisDepth", analysisDepth)
        );
    }

    /**
     * Markdown 형식 - 1. 회사 기본 정보
     */
    public ResponseStream<GenerateContentResponse> analyzeCompanyText1(String today, String company,
                                                                       String analysisDepth) {
        return generateContent(
                loadPrompt(prompt1),
                Map.of("today", today, "company", company, "analysisDepth", analysisDepth)
        );
    }

    /**
     * Markdown 형식 - 2. 회사 이슈
     */
    public ResponseStream<GenerateContentResponse> analyzeCompanyText2(String today, String company,
                                                                       String analysisDepth) {
        return generateContent(
                loadPrompt(prompt2),
                Map.of("today", today, "company", company, "analysisDepth", analysisDepth)
        );
    }

    /**
     * Markdown 형식 - 3. 직무 핵심 사업
     */
    public ResponseStream<GenerateContentResponse> analyzeCompanyText3(String today, String company,
                                                                       String position, String analysisDepth) {
        return generateContent(
                loadPrompt(prompt3),
                Map.of("today", today, "company", company, "position", position, "analysisDepth", analysisDepth)
        );
    }

    /**
     * Markdown 형식 - 4. 직무 이슈
     */
    public ResponseStream<GenerateContentResponse> analyzeCompanyText4(String today, String company,
                                                                       String position, String analysisDepth) {
        return generateContent(
                loadPrompt(prompt4),
                Map.of("today", today, "company", company, "position", position, "analysisDepth", analysisDepth)
        );
    }

    // ============ Core Logic ============

    /**
     * Gemini API 호출 핵심 로직
     */
    private ResponseStream<GenerateContentResponse> generateContent(String systemPrompt,
                                                                    Map<String, String> userInputs) {
        Client client = Client.builder().apiKey(apiKey).build();

        // User Message 생성
        JsonObject userInput = new JsonObject();
        userInputs.forEach(userInput::addProperty);
        String userMessage = gson.toJson(userInput);

        // Contents 구성
        List<Content> contents = ImmutableList.of(
                Content.builder()
                        .role("user")
                        .parts(ImmutableList.of(Part.fromText(userMessage)))
                        .build()
        );

        // Config 구성
        GenerateContentConfig config = GenerateContentConfig.builder()
                .thinkingConfig(ThinkingConfig.builder().thinkingBudget(0).build())
                .tools(List.of(createGoogleSearchTool()))
                .systemInstruction(Content.fromParts(Part.fromText(systemPrompt)))
                .build();

        return client.models.generateContentStream(MODEL, contents, config);
    }

    /**
     * Google Search Tool 생성
     */
    private Tool createGoogleSearchTool() {
        return Tool.builder()
                .googleSearch(GoogleSearch.builder().build())
                .build();
    }

    /**
     * 프롬프트 파일 로드 (통합)
     */
    private String loadPrompt(Resource resource) {
        try {
            byte[] bytes = FileCopyUtils.copyToByteArray(resource.getInputStream());
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Failed to load prompt template: {}", resource.getFilename(), e);
            throw new RuntimeException("Failed to load prompt template", e);
        }
    }

    // Deprecated: 하위 호환성을 위해 남겨둠 (나중에 제거 가능)
    @Deprecated
    public String loadSearchPrompt() {
        return loadPrompt(companyPositionSearchPromptResource);
    }

    @Deprecated
    public String loadSearchPrompt1() {
        return loadPrompt(prompt1);
    }

    @Deprecated
    public String loadSearchPrompt2() {
        return loadPrompt(prompt2);
    }

    @Deprecated
    public String loadSearchPrompt3() {
        return loadPrompt(prompt3);
    }

    @Deprecated
    public String loadSearchPrompt4() {
        return loadPrompt(prompt4);
    }
}