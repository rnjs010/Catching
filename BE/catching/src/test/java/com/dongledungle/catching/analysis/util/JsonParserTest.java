package com.dongledungle.catching.analysis.util;

import com.dongledungle.catching.common.util.JsonParserUtil;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("JsonParserUtil 테스트")
public class JsonParserTest {
    @Test
    @DisplayName("정상 JSON 파싱")
    void parseValidJson(){
        // Given - 실제 AI 응답 형태
        String response = """
            {
              "company": {
                "summary": {
                  "basic_info": {
                    "name": "한국수자원공사"
                  }
                }
              },
              "position": {
                "title": "토목"
              }
            }
            """;

        // When
        String extracted = JsonParserUtil.extractJson(response);
        JsonObject json = JsonParserUtil.parseToJsonObject(extracted);


        // Then
        assertThat(extracted).startsWith("{");
        assertThat(extracted).endsWith("}");

        // Then
        assertThat(extracted).startsWith("{");
        assertThat(extracted).endsWith("}");
        assertThat(JsonParserUtil.isValidCompanyAnalysis(json)).isTrue();
    }

    @Test
    @DisplayName("JSON 구조 검증 - company, position 필드 존재")
    void validateCompanyAnalysisStructure() {
        // Given - 유효한 구조
        String validJson = """
            {
              "company": {},
              "position": {}
            }
            """;

        // Given - 무효한 구조 (position 없음)
        String invalidJson = """
            {
              "company": {}
            }
            """;

        // When & Then
        JsonObject valid = JsonParserUtil.parseToJsonObject(validJson);
        JsonObject invalid = JsonParserUtil.parseToJsonObject(invalidJson);

        assertThat(JsonParserUtil.isValidCompanyAnalysis(valid)).isTrue();
        assertThat(JsonParserUtil.isValidCompanyAnalysis(invalid)).isFalse();
    }

    @Test
    @DisplayName("JSON이 없는 경우 예외 발생")
    void throwExceptionWhenNoJson() {
        // Given
        String noJson = "Sorry, I cannot analyze this.";

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            JsonParserUtil.extractJson(noJson);
        });
    }

    @Test
    @DisplayName("손상된 JSON - 파싱 예외")
    void throwExceptionWhenMalformedJson() {
        // Given - 쉼표 누락
        String malformedJson = """
            {
              "company": "test"
              "position": "backend"
            }
            """;

        // When
        String extracted = JsonParserUtil.extractJson(malformedJson);

        // Then - 파싱 시 예외 발생
        assertThrows(JsonSyntaxException.class, () -> {
            JsonParserUtil.validateJson(extracted);
        });
    }
}
