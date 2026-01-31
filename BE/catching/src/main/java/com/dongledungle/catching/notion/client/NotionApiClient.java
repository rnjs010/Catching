package com.dongledungle.catching.notion.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Notion REST API 호출 담당 Client
 * - Authorization / Notion-Version 헤더를 일관되게 넣기 위해 분리
 */
@Component
@RequiredArgsConstructor
public class NotionApiClient {

    private final RestClient.Builder builder;

    @Value("${notion.version:2022-06-28}")
    private String notionVersion;

    private RestClient client() {
        return builder.baseUrl("https://api.notion.com/v1").build();
    }

    /**
     * OAuth 토큰 교환 (/oauth/token)
     * - Basic Auth 헤더 필요
     */
    public Map exchangeToken(String basicAuthHeader, Map<String, Object> body) {
        return client()
                .post()
                .uri("/oauth/token")
                .header(HttpHeaders.AUTHORIZATION, basicAuthHeader)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);
    }

    /**
     * Search API (/search)
     * - 페이지 목록 조회용
     */
    public Map search(String accessToken, Map<String, Object> body) {
        return client()
                .post()
                .uri("/search")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header("Notion-Version", notionVersion)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);
    }

    public Map fetchPageTitle(String accessToken, String pageId) {
        return client()
                .get()
                .uri("/pages/"+pageId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header("Notion-Version", notionVersion)
                .retrieve()
                .body(Map.class);
    }

    /**
     * 페이지 생성 (/pages)
     * - 기본 페이지 아래 자식 페이지 생성
     */
    public Map createPage(String accessToken, Map<String, Object> body) {
        return client()
                .post()
                .uri("/pages")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header("Notion-Version", notionVersion)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);
    }

    /**
     * 블록 children 추가 (/blocks/{id}/children)
     * - 한 번에 최대 100개 children 제한이 있으니 서비스에서 배치 처리해야 함
     */
    public Map appendChildren(String accessToken, String blockId, Map<String, Object> body) {
        return client()
                .patch()
                .uri("/blocks/{id}/children", blockId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header("Notion-Version", notionVersion)
                .header(HttpHeaders.CONTENT_TYPE, "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);
    }
}
