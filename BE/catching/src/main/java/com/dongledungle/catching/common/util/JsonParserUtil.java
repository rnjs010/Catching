package com.dongledungle.catching.common.util;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JsonParserUtil {
    /**
     * AI 응답에서 JSON 추출
     * @param rawResponse AI의 원본 응답 텍스트
     * @return 추출된 JSON 문자열
     * @throws IllegalArgumentException JSON을 찾을 수 없는 경우
     */
    public static String extractJson(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new IllegalArgumentException("Response is null or empty");
        }

        int startIndex = rawResponse.indexOf('{');
        int endIndex = rawResponse.lastIndexOf('}');

        if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex) {
            log.error("No valid JSON boundaries found in response: {}",
                    rawResponse.substring(0, Math.min(100, rawResponse.length())));
            throw new IllegalArgumentException("No valid JSON found in response");
        }

        String extracted = rawResponse.substring(startIndex, endIndex + 1);

        // 추출된 JSON이 유효한지 검증
        validateJson(extracted);

        return extracted;
    }


    public static void validateJson(String jsonString) {
        try {
            JsonParser.parseString(jsonString);
        } catch (JsonSyntaxException e) {
            log.error("Invalid JSON syntax: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * JSON 문자열을 JsonObject로 변환
     * @param jsonString JSON 문자열
     * @return JsonObject
     */
    public static JsonObject parseToJsonObject(String jsonString) {
        return JsonParser.parseString(jsonString).getAsJsonObject();
    }

    /**
     * AI 응답에서 JSON 추출 및 파싱 (원스톱)
     * @param rawResponse AI 원본 응답
     * @return JsonObject
     */
    public static JsonObject extractAndParse(String rawResponse) {
        String extracted = extractJson(rawResponse);
        return parseToJsonObject(extracted);
    }

    /**
     * 회사 정보 분석 응답 구조 검증
     * @param json 파싱된 JsonObject
     * @return 유효하면 true (company와 position 필드 존재)
     */
    public static boolean isValidCompanyAnalysis(JsonObject json) {
        try {
            return json.has("company") && json.has("position");
        } catch (Exception e) {
            log.error("Failed to validate company analysis structure", e);
            return false;
        }
    }
}
