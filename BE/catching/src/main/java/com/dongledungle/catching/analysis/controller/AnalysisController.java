package com.dongledungle.catching.analysis.controller;

import com.dongledungle.catching.analysis.dto.AnalysisRequestDto;
import com.dongledungle.catching.analysis.dto.AnalysisResponseDto;
import com.dongledungle.catching.analysis.service.AnalysisService;
import com.dongledungle.catching.analysis.service.GeminiService;
import com.dongledungle.catching.analysis.service.NotionService;
import com.dongledungle.catching.common.util.JsonParserUtil;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnalysisController {

    private final GeminiService geminiService;
    private final NotionService notionService;
    private final AnalysisService analysisService;

    private static final int MAX_AUTO_RETRIES = 2; // 서버에서 자동 재시도(2회)
    private static final long RETRY_DELAY_MS = 1000;

    @PostMapping(value = "/analysis", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyze(@RequestBody AnalysisRequestDto request) {
        SseEmitter emitter = new SseEmitter(600000L); 
        
        StringBuilder finalJsonResponse = new StringBuilder();

        try {
            ResponseStream<GenerateContentResponse> responseStream = 
                    geminiService.analyzeCompany(
                        request.getToday(),
                        request.getCompany(),
                        request.getPosition(),
                        request.getAnalysisDepth()
                    );

            for (GenerateContentResponse response : responseStream) {
                try {
                    String textChunk = response.candidates().get().get(0).content().get().parts().get().get(0).text().get();
                    
                    finalJsonResponse.append(textChunk); 
                    
                    emitter.send(SseEmitter.event().name("data").data(textChunk));
                    emitter.send(SseEmitter.event().comment("flush"));
                } catch (IOException e) {
                    System.err.println("SSE Client Write Error: " + e.getMessage());
                    emitter.completeWithError(e);
                    return emitter;
                }
            }

            String rawJson = finalJsonResponse.toString();
            // String finalJson = finalJsonResponse.toString();
            int startIndex = rawJson.indexOf('{');
            int endIndex = rawJson.lastIndexOf('}');

            String finalJson = "";

            if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                finalJson = rawJson.substring(startIndex, endIndex + 1); 
            } else {
                System.err.println("JSON Parsing Error: Cannot find valid JSON object boundary in stream output.");
                emitter.completeWithError(new RuntimeException("AI analysis failed to return valid JSON object."));
                return emitter;
            }

//            String pageId = notionService.createPageFromAnalysis(finalJson);
//
//            emitter.send(SseEmitter.event()
//                    .name("notionComplete")
//                    .data(pageId)
//                    .reconnectTime(1000L)
//            );
//
//            emitter.complete();

        } catch (Exception e) {
            System.err.println("Analysis/Notion Streaming Error: " + e.getMessage());
            emitter.completeWithError(e);
        }

        return emitter;
    }

    @PostMapping("/analysis/raw")
    public ResponseEntity<AnalysisResponseDto> analyzeRaw(@RequestBody AnalysisRequestDto request){
        try{
            String redisCache = analysisService.getFromRedisCache(
                    request.getCompany(),
                    request.getPosition()
            );

            // redis 캐시 히트
            if(redisCache != null){
                var analysis = analysisService.findAnalysisInCurrentWeek(
                        request.getCompany(),
                        request.getPosition()
                );

                if(analysis.isPresent()){
                    analysisService.saveHistory(1L, analysis.get().getCompanyPositionId());
                }

                return ResponseEntity.ok(
                        AnalysisResponseDto.success(redisCache, "redis", null)
                );
            }

            // db에서 해당 주차 데이터 조회
            var weekAnalysis = analysisService.findAnalysisInCurrentWeek(
                    request.getCompany(),
                    request.getPosition()
            );

            if (weekAnalysis.isPresent()) {
                var entity = weekAnalysis.get();
                String content = entity.getContent();
                long analysisId = entity.getCompanyPositionId();

                // History 저장
                analysisService.saveHistory(1L, analysisId);

                // Redis에 저장 (다음번 조회 최적화)
                analysisService.saveToRedisCache(
                        request.getCompany(),
                        request.getPosition(),
                        content
                );

                return ResponseEntity.ok(
                        AnalysisResponseDto.success(content, "database", analysisId)
                );
            }

            // ai api 호출
            int attemptCount = 0;
            Exception lastException = null;

            // 재시도
            while (attemptCount < MAX_AUTO_RETRIES) {
                attemptCount++;

                try {
                    if (attemptCount > 1) {
                        log.info("재시도 중... ({}/{})", attemptCount, MAX_AUTO_RETRIES);
                        Thread.sleep(RETRY_DELAY_MS);
                    }

                    // AI API 호출
                    ResponseStream<GenerateContentResponse> responseStream =
                            geminiService.analyzeCompany(
                                    request.getToday(),
                                    request.getCompany(),
                                    request.getPosition(),
                                    request.getAnalysisDepth()
                            );

                    // 응답 수집
                    StringBuilder rawResponse = new StringBuilder();
                    for (GenerateContentResponse response : responseStream) {
                        String textChunk = response.candidates().get().get(0)
                                .content().get().parts().get().get(0).text().get();
                        rawResponse.append(textChunk);
                    }

                    // JSON 파싱 및 검증
                    String rawJson = rawResponse.toString();
                    String finalJson = JsonParserUtil.extractJson(rawJson);

                    JsonObject json = JsonParserUtil.parseToJsonObject(finalJson);
                    if (!JsonParserUtil.isValidCompanyAnalysis(json)) {
                        throw new IllegalArgumentException("Invalid analysis structure");
                    }

                    // DB 저장 (Analysis)
                    long analysisId = analysisService.saveAnalysisToDatabase(
                            request.getCompany(),
                            request.getPosition(),
                            finalJson
                    );

                    // History 저장
                    analysisService.saveHistory(1L, analysisId);

                    // Redis에 저장
                    analysisService.saveToRedisCache(
                            request.getCompany(),
                            request.getPosition(),
                            finalJson
                    );

                    return ResponseEntity.ok(
                            AnalysisResponseDto.success(finalJson, "ai", analysisId)
                    );

                } catch (Exception e) {
                    lastException = e;
                    log.error("AI 분석 실패 (시도 {}/{}): {}",
                            attemptCount, MAX_AUTO_RETRIES, e.getMessage());

                    if (attemptCount >= MAX_AUTO_RETRIES) {
                        break;
                    }
                }
            }

            // ===== 최종 실패 =====
            log.error("❌ AI 분석 최종 실패 ({}회 시도)", attemptCount);
            String errorType = determineErrorType(lastException);
            String errorMessage = getUserFriendlyMessage(errorType);

            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(AnalysisResponseDto.failure(errorType, errorMessage, attemptCount));

        } catch (Exception e) {
            log.error("예상치 못한 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AnalysisResponseDto.failure("UNKNOWN", e.getMessage(), 0));
        }
    }

    private String determineErrorType(Exception e) {
        if (e == null) return "UNKNOWN";

        if (e instanceof IllegalArgumentException) {
            if (e.getMessage().contains("No valid JSON")) {
                return "INVALID_RESPONSE";
            }
            return "INVALID_STRUCTURE";
        } else if (e instanceof com.google.gson.JsonSyntaxException) {
            return "MALFORMED_JSON";
        }
        return "AI_ERROR";
    }

    private String getUserFriendlyMessage(String errorType) {
        return switch (errorType) {
            case "INVALID_RESPONSE" ->
                    "AI가 올바른 형식으로 응답하지 않았습니다. 잠시 후 다시 시도해주세요.";
            case "INVALID_STRUCTURE" ->
                    "분석 결과가 불완전합니다. 회사명과 직무명을 확인 후 다시 시도해주세요.";
            case "MALFORMED_JSON" ->
                    "분석 결과 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
            case "AI_ERROR" ->
                    "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.";
            default ->
                    "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        };
    }
}