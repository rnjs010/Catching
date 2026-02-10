package com.dongledungle.catching.analysis.controller;

import com.dongledungle.catching.analysis.dto.AnalysisDetailResponseDto;
import com.dongledungle.catching.analysis.dto.AnalysisRequestDto;
import com.dongledungle.catching.analysis.dto.AnalysisResponseDto;
import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.service.AnalysisService;
import com.dongledungle.catching.analysis.service.AnalysisService.CacheResult;
import com.dongledungle.catching.analysis.service.GeminiService;
import com.dongledungle.catching.analysis.service.RateLimitService;
import com.dongledungle.catching.auth.entity.User;
import com.dongledungle.catching.common.response.ApiResponse;
import com.dongledungle.catching.common.util.JsonParserUtil;
import com.dongledungle.catching.history.service.HistoryService;
import com.google.genai.ResponseStream;
import com.google.genai.types.Candidate;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

@Slf4j
@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final GeminiService geminiService;
    private final AnalysisService analysisService;
    private final HistoryService historyService;
    private final RateLimitService rateLimitService;
    private final Gson gson = new Gson();

    private static final int MAX_AUTO_RETRIES = 2;
    private static final long RETRY_DELAY_MS = 1000;

    @PostMapping(value = "/json", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyzeJson(Authentication authentication, @RequestBody AnalysisRequestDto request) {
        SseEmitter emitter = new SseEmitter(600000L);
        Long userId = Long.parseLong((String) authentication.getPrincipal());
        request.setUserId(userId);
        CompletableFuture.runAsync(() -> processAnalysisWithSSE(request, emitter, true));
        return emitter;
    }

    @PostMapping(value = "/text", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyzeText(Authentication authentication, @RequestBody AnalysisRequestDto request) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());
        SseEmitter emitter = new SseEmitter(600000L);

        // rate limit 체크
        // Rate limit 체크
        if (!rateLimitService.isUserAllowed(userId)) {
            Long remainingTime = rateLimitService.getRemainingTime(userId);
            sendSseEvent(emitter, "error",
                    gson.toJson(new ErrorResponse("RATE_LIMIT",
                            remainingTime + "초 후에 다시 시도해주세요.")));
            emitter.complete();
            return emitter;
        }


        request.setUserId(userId);
        CompletableFuture.runAsync(() -> processAnalysisWithSSE(request, emitter, false));
        return emitter;
    }

    @GetMapping("/{analysisId}")
    public ResponseEntity<ApiResponse<AnalysisDetailResponseDto>> getAnalysisDetail(
            @PathVariable Long analysisId
    ){
        AnalysisDetailResponseDto analysis = analysisService.getAnalysisDetail(analysisId);
        return ResponseEntity.ok(ApiResponse.success("분석 상세", analysis));
    }

    @PostMapping("/raw")
    public ResponseEntity<ApiResponse<AnalysisResponseDto>> analyzeRaw(@RequestBody AnalysisRequestDto request) {
        log.info("분석 요청: 회사={}, 직무={}, 사용자={}", request.getCompany(), request.getPosition(), request.getUserId());

        try {
            // 1. Redis 캐시 확인
            CacheResult cachedResult = checkCache(request);
            if (cachedResult != null) {
                return ResponseEntity.ok(ApiResponse.success("Redis Hit",
                        AnalysisResponseDto.success(request.getCompany(), request.getPosition(), cachedResult.content(), "redis")));
            }

            // 2. DB 확인
            var dbResult = checkDatabase(request);
            if (dbResult != null) {
                return ResponseEntity.ok(ApiResponse.success(
                        AnalysisResponseDto.success(request.getCompany(), request.getPosition(), dbResult.getContent(), "database")));
            }

            // 3. AI API 호출
            String aiResult = callAIWithRetry(request);
            return ResponseEntity.ok(ApiResponse.success("AI 분석이 완료되었습니다",
                    AnalysisResponseDto.success(request.getCompany(), request.getPosition(), aiResult, "ai")));

        } catch (Exception e) {
            log.error("분석 실패", e);
            String errorType = determineErrorType(e);
            String errorMessage = getUserFriendlyMessage(errorType);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error(HttpStatus.SERVICE_UNAVAILABLE.value(), errorMessage,
                            AnalysisResponseDto.failure(request.getCompany(), request.getPosition(), errorType, errorMessage)));
        }
    }

    // ============ SSE 처리 ============

    private void processAnalysisWithSSE(AnalysisRequestDto request, SseEmitter emitter, boolean isJsonMode) {
        try {
            // 동일 분석이 이미 처리 중인지 체크
            if (rateLimitService.isAnalysisProcessing(request.getUserId(), request.getCompany(), request.getPosition())) {
                sendSseEvent(emitter, "error",
                        gson.toJson(new ErrorResponse("PROCESSING",
                                "해당 분석이 이미 진행 중입니다. 잠시 후 다시 시도해주세요.")));
                emitter.complete();
                return;
            }

            // 1. Redis 캐시 확인
            sendSseEvent(emitter, "status", "캐시 확인 중...");
            CacheResult cachedResult = checkCache(request);
            if (cachedResult != null) {
                sendCachedResult(emitter, request, cachedResult.content(), cachedResult.companyPositionId(), "redis");
                return;
            }

            // 2. DB 확인
            sendSseEvent(emitter, "status", "기존 분석 결과 확인 중...");
            Analysis dbResult = checkDatabase(request);
            if (dbResult != null) {
                sendCachedResult(emitter, request, dbResult.getContent(), dbResult.getCompanyPositionId(), "database");
                return;
            }

            // 3. AI API 호출
            sendSseEvent(emitter, "status", "AI가 분석 중입니다...");
            sendSseEvent(emitter, "source", "ai");
            if (isJsonMode) {
                streamAIAnalysisJson(request, emitter);
            } else {
                streamAIAnalysisText(request, emitter);
            }

        } catch (Exception e) {
            log.error("SSE 처리 중 예외 발생", e);
            handleSseError(emitter, e);
        }
    }

    private void sendCachedResult(SseEmitter emitter, AnalysisRequestDto request, String content, Long analysisId, String source) {
        log.info("{} 조회 완료", source);
        sendSseEvent(emitter, "source", source);
        sendSseEvent(emitter, "status", source.equals("redis") ? "캐시된 분석 결과를 불러왔습니다" : "저장된 분석 결과를 불러왔습니다");
        sendSseEvent(emitter, "data", content);
        sendSseEvent(emitter, "analysisId", Long.toString(analysisId));

        if (source.equals("database")) {
            analysisService.saveToRedisCache(request.getCompany(), request.getPosition(), content, analysisId);
        }
        historyService.saveHistory(request.getUserId(), analysisId);

        sendSseEvent(emitter, "complete", "success");
        emitter.complete();
    }

    // ============ AI 스트리밍 (JSON) ============

    private void streamAIAnalysisJson(AnalysisRequestDto request, SseEmitter emitter) {
        retryWithLimit(() -> {
            ResponseStream<GenerateContentResponse> responseStream = geminiService.analyzeCompany(
                    request.getToday(), request.getCompany(), request.getPosition(), request.getAnalysisDepth());

            String fullResponse = collectStreamResponse(responseStream);
            String finalJson = JsonParserUtil.extractJson(fullResponse);
            JsonObject json = JsonParserUtil.parseToJsonObject(finalJson);

            if (!JsonParserUtil.isValidCompanyAnalysis(json)) {
                throw new IllegalArgumentException("Invalid analysis structure");
            }

            saveAnalysisResult(request, finalJson);
            sendSseEvent(emitter, "data", finalJson);
            sendSseEvent(emitter, "status", "분석이 완료되었습니다!");
            sendSseEvent(emitter, "complete", "success");
            emitter.complete();

        }, emitter);
    }

    // ============ AI 스트리밍 (Text - 병렬 처리) ============
    private void streamAIAnalysisText(AnalysisRequestDto request, SseEmitter emitter) {
        try {
            // 각 프롬프트를 독립적으로 재시도 가능하게 병렬 실행
            CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() ->
                    retryIndividualPrompt("company-summary", emitter, () ->
                            geminiService.analyzeCompanyText1(request.getToday(), request.getCompany(), request.getAnalysisDepth())));

            CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() ->
                    retryIndividualPrompt("company-issue", emitter, () ->
                            geminiService.analyzeCompanyText2(request.getToday(), request.getCompany(), request.getAnalysisDepth())));

            CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() ->
                    retryIndividualPrompt("position-main-business", emitter, () ->
                            geminiService.analyzeCompanyText3(request.getToday(), request.getCompany(), request.getPosition(), request.getAnalysisDepth())));

            CompletableFuture<String> future4 = CompletableFuture.supplyAsync(() ->
                    retryIndividualPrompt("position-issue", emitter, () ->
                            geminiService.analyzeCompanyText4(request.getToday(), request.getCompany(), request.getPosition(), request.getAnalysisDepth())));

            // 모든 응답 대기
            CompletableFuture<Void> allFutures = CompletableFuture.allOf(future1, future2, future3, future4);
            allFutures.join();

            // 결과 수집 및 검증 - 하나라도 실패(빈 문자열)하면 전체 실패
            String result1 = future1.join();
            String result2 = future2.join();
            String result3 = future3.join();
            String result4 = future4.join();

            // 하나라도 실패한 경우 (빈 문자열) 전체 실패 처리
            if (result1.isEmpty() || result2.isEmpty() || result3.isEmpty() || result4.isEmpty()) {
                throw new RuntimeException("일부 프롬프트 호출이 실패했습니다. 모든 분석이 완료되어야 합니다.");
            }

            // 모든 프롬프트가 성공한 경우에만 결과 결합
            String fullResponse = String.join("\n\n", result1, result2, result3, result4);

            long analysisId = saveAnalysisResult(request, fullResponse, false);
            sendSseEvent(emitter, "data", fullResponse);
            sendSseEvent(emitter, "analysisId", Long.toString(analysisId));
            sendSseEvent(emitter, "status", "분석이 완료되었습니다!");
            sendSseEvent(emitter, "complete", "success");
            emitter.complete();

        } catch (Exception e) {
            log.error("AI 분석 최종 실패", e);
            String errorType = determineErrorType(e);
            String errorMessage = getUserFriendlyMessage(errorType);
            sendSseEvent(emitter, "error", gson.toJson(new ErrorResponse(errorType, errorMessage)));
            emitter.completeWithError(e);
        }
    }

    /**
     * 개별 프롬프트 재시도 로직 (독립적으로 최대 MAX_AUTO_RETRIES번 시도)
     */
    private String retryIndividualPrompt(String promptName, SseEmitter emitter,
                                         Supplier<ResponseStream<GenerateContentResponse>> streamSupplier) {
        for (int attempt = 1; attempt <= MAX_AUTO_RETRIES; attempt++) {
            try {
                if (attempt > 1) {
                    log.info("[{}] 재시도 중... ({}/{})", promptName, attempt, MAX_AUTO_RETRIES);
                    sendSseEvent(emitter, "retry",
                            gson.toJson(new RetryInfo(promptName, attempt, MAX_AUTO_RETRIES)));
                    Thread.sleep(RETRY_DELAY_MS);
                }

                log.debug("[{}] API 호출 시작", promptName);
                String response = collectStreamResponse(streamSupplier.get());
                log.info("[{}] 성공", promptName);

                // 성공하면 바로 SSE 전송
                sendSseEvent(emitter, promptName, response);
                return response;

            } catch (Exception e) {
                log.error("[{}] 실패 (시도 {}/{}): {}", promptName, attempt, MAX_AUTO_RETRIES, e.getMessage());

                if (attempt >= MAX_AUTO_RETRIES) {
                    // 최종 실패 - 에러 이벤트 전송하지만 전체 프로세스는 계속 진행
                    log.error("[{}] 최종 실패", promptName);
                    sendSseEvent(emitter, "partial-error",
                            gson.toJson(new PartialErrorResponse(promptName, "해당 항목 분석에 실패했습니다")));
                    return ""; // 빈 문자열 반환으로 부분 실패 허용
                }
            }
        }

        return ""; // 모든 재시도 실패 시 빈 문자열
    }

    // ============ 공통 유틸리티 메서드 ============

    private CacheResult checkCache(AnalysisRequestDto request) {
        log.debug("Redis 캐시 확인");
        CacheResult cache = analysisService.getFromRedisCache(request.getCompany(), request.getPosition());
        return cache;
    }

    private Analysis checkDatabase(AnalysisRequestDto request) {
        log.debug("DB 확인");
        return analysisService.findAnalysisInCurrentWeek(request.getCompany(), request.getPosition()).orElse(null);
    }

    private String callAIWithRetry(AnalysisRequestDto request) throws Exception {
        log.debug("AI API 호출");
        Exception lastException = null;

        for (int attempt = 1; attempt <= MAX_AUTO_RETRIES; attempt++) {
            try {
                if (attempt > 1) {
                    log.info("재시도 중... ({}/{})", attempt, MAX_AUTO_RETRIES);
                    Thread.sleep(RETRY_DELAY_MS);
                }

                ResponseStream<GenerateContentResponse> responseStream = geminiService.analyzeCompany(
                        request.getToday(), request.getCompany(), request.getPosition(), request.getAnalysisDepth());

                String rawJson = collectStreamResponse(responseStream);
                String finalJson = JsonParserUtil.extractJson(rawJson);
                JsonObject json = JsonParserUtil.parseToJsonObject(finalJson);

                if (!JsonParserUtil.isValidCompanyAnalysis(json)) {
                    throw new IllegalArgumentException("Invalid analysis structure");
                }

                saveAnalysisResult(request, finalJson);
                return finalJson;

            } catch (Exception e) {
                lastException = e;
                log.error("AI 분석 실패 (시도 {}/{}): {}", attempt, MAX_AUTO_RETRIES, e.getMessage());
            }
        }

        throw lastException != null ? lastException : new RuntimeException("AI 분석 실패");
    }

    private void retryWithLimit(Runnable task, SseEmitter emitter) {
        for (int attempt = 1; attempt <= MAX_AUTO_RETRIES; attempt++) {
            try {
                if (attempt > 1) {
                    log.info("재시도 중... ({}/{})", attempt, MAX_AUTO_RETRIES);
                    sendSseEvent(emitter, "retry",
                            String.format("{\"attempt\": %d, \"max\": %d}", attempt, MAX_AUTO_RETRIES));
                    Thread.sleep(RETRY_DELAY_MS);
                }

                task.run();
                return;

            } catch (Exception e) {
                log.error("AI 분석 실패 (시도 {}/{}): {}", attempt, MAX_AUTO_RETRIES, e.getMessage());

                if (attempt >= MAX_AUTO_RETRIES) {
                    String errorType = determineErrorType(e);
                    String errorMessage = getUserFriendlyMessage(errorType);
                    sendSseEvent(emitter, "error", gson.toJson(new ErrorResponse(errorType, errorMessage)));
                    emitter.completeWithError(e);
                    return;
                }
            }
        }
    }

    private String collectStreamResponse(ResponseStream<GenerateContentResponse> responseStream) {
        StringBuilder fullResponse = new StringBuilder();
        for (GenerateContentResponse response : responseStream) {
            if (!response.candidates().isPresent()) continue;

            for (Candidate candidate : response.candidates().get()) {
                if (!candidate.content().isPresent()) continue;

                for (Part part : candidate.content().get().parts().orElse(List.of())) {
                    part.text().ifPresent(fullResponse::append);
                }
            }
        }
        return fullResponse.toString();
    }

    /**
     * 분석 결과 저장 (오버로드 - JSON 형식 기본)
     */
    private void saveAnalysisResult(AnalysisRequestDto request, String content) {
        saveAnalysisResult(request, content, true);
    }

    /**
     * 분석 결과 저장 (타입 구분)
     */
    private long saveAnalysisResult(AnalysisRequestDto request, String content, boolean isJson) {
        // JSON이 아닌 경우 JSON 형식으로 래핑
        String contentToSave = isJson ? content : wrapTextAsJson(content);

        long analysisId = analysisService.saveAnalysisToDatabase(
                request.getCompany(), request.getPosition(), contentToSave);
        historyService.saveHistory(request.getUserId(), analysisId);
        analysisService.saveToRedisCache(request.getCompany(), request.getPosition(), contentToSave, analysisId);

        return analysisId;
    }

    /**
     * 마크다운 텍스트를 JSON 형식으로 래핑
     */
    private String wrapTextAsJson(String textContent) {
        JsonObject wrapper = new JsonObject();
        wrapper.addProperty("content", textContent);
        wrapper.addProperty("format", "markdown");
        wrapper.addProperty("timestamp", System.currentTimeMillis());
        return gson.toJson(wrapper);
    }

    private void sendSseEvent(SseEmitter emitter, String eventName, String data) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(data));
        } catch (IOException e) {
            log.error("SSE 이벤트 전송 실패: {}", e.getMessage());
            throw new RuntimeException("SSE 전송 실패", e);
        }
    }

    private void handleSseError(SseEmitter emitter, Exception e) {
        try {
            String errorMessage = "분석 중 오류가 발생했습니다: " + e.getMessage();
            sendSseEvent(emitter, "error", gson.toJson(new ErrorResponse("SYSTEM_ERROR", errorMessage)));
            emitter.completeWithError(e);
        } catch (Exception ex) {
            log.error("에러 처리 중 추가 오류 발생", ex);
            emitter.completeWithError(ex);
        }
    }

    private record ErrorResponse(String type, String message) {}
    private record RetryInfo(String promptName, int attempt, int maxAttempts) {}
    private record PartialErrorResponse(String promptName, String message) {}

    private String determineErrorType(Exception e) {
        if (e == null) return "UNKNOWN";
        if (e instanceof IllegalArgumentException) {
            return e.getMessage().contains("No valid JSON") ? "INVALID_RESPONSE" : "INVALID_STRUCTURE";
        } else if (e instanceof com.google.gson.JsonSyntaxException) {
            return "MALFORMED_JSON";
        }
        return "AI_ERROR";
    }

    private String getUserFriendlyMessage(String errorType) {
        return switch (errorType) {
            case "INVALID_RESPONSE" -> "AI가 올바른 형식으로 응답하지 않았습니다. 잠시 후 다시 시도해주세요.";
            case "INVALID_STRUCTURE" -> "분석 결과가 불완전합니다. 회사명과 직무명을 확인 후 다시 시도해주세요.";
            case "MALFORMED_JSON" -> "분석 결과 처리 중 오류가 발생했습니다. 다시 시도해주세요.";
            case "AI_ERROR" -> "AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.";
            default -> "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        };
    }
}