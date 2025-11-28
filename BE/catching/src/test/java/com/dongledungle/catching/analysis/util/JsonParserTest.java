package com.dongledungle.catching.analysis.util;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DisplayName("JSON 파싱 유틸리티 테스트")
public class JsonParserTest {
    @Test
    @DisplayName("정상 JSON 파싱")
    void parseValidJson(){
        // Given - 실제 AI 응답 형태
        String response = """
                    {
                      "company": "현대오토에버",
                      "position": "스마트팩토리",
                      "analysis": "상세 분석..."
                    }
                """;
        // When
        String extracted = extractJson(response);

        // Then
        assertThat(extracted).startsWith("{");
        assertThat(extracted).endsWith("}");

        JsonObject json = new Gson().fromJson(extracted, JsonObject.class);
        assertThat(json.get("company").getAsString()).isEqualTo("현대오토에버");
    }

    @Test
    @DisplayName("JSON이 없는 경우 예외 발생")
    void throwExceptionWhenNoJson() {
        String noJson = "empty JSON";

        assertThrows(IllegalArgumentException.class, () -> {
            extractJson(noJson);
        });
    }

    // 실제 파싱 로직
    private String extractJson(String raw) {
        int startIndex = raw.indexOf('{');
        int endIndex = raw.lastIndexOf('}');

        if (startIndex == -1 || endIndex == -1 || endIndex <= startIndex) {
            throw new IllegalArgumentException("No valid JSON found");
        }

        return raw.substring(startIndex, endIndex + 1);
    }
}
