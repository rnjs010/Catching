package com.dongledungle.catching.notion.service;

import com.dongledungle.catching.notion.client.NotionApiClient;
import com.dongledungle.catching.notion.dto.response.NotionPageItemResponse;
import com.dongledungle.catching.notion.entity.Notion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Notion 페이지 목록 조회 / export 기능 담당
 *
 * 핵심:
 * - Search API는 하위 페이지까지 다 내려줄 수 있으니
 *   parent.type == "workspace" 인 최상위 페이지만 필터링합니다.
 */
@Service
@RequiredArgsConstructor
public class NotionExportService {

    private final NotionIntegrationService notionIntegrationService;
    private final NotionApiClient notionApiClient;

    public List<NotionPageItemResponse> getTopLevelPages(Long userId) {
        Notion notion = notionIntegrationService.getOrThrow(userId);
        String accessToken = notion.getNotionAccessToken();

        Map<String, Object> body = Map.of(
                "page_size", 50,
                "filter", Map.of("property", "object", "value", "page")
        );

        Map result = notionApiClient.search(accessToken, body);
        Object resultsObj = result.get("results");

        if (!(resultsObj instanceof List<?> results)) {
            return List.of();
        }

        List<NotionPageItemResponse> out = new ArrayList<>();
        for (Object o : results) {
            if (!(o instanceof Map page)) continue;

            // 최상위 페이지 필터: parent.type == workspace
            Object parentObj = page.get("parent");
            if (!(parentObj instanceof Map parent)) continue;

            Object typeObj = parent.get("type");
            if (typeObj == null || !"workspace".equals(String.valueOf(typeObj))) continue;

            String id = String.valueOf(page.get("id"));
            String title = extractTitleFallback(page);

            out.add(new NotionPageItemResponse(id, title));
        }

        return out;
    }

    /**
     * 기본 페이지 밑에 자식 페이지 생성 + blocks append
     * - blocks는 최대 100개씩 나눠서 append
     */
    public Map<String, Object> export(Long userId, String title, List<Map<String, Object>> blocks) {
        Notion notion = notionIntegrationService.getOrThrow(userId);

        if (!notion.hasDefaultPage()) {
            throw new IllegalStateException("기본 페이지가 설정되지 않았습니다.");
        }

        String accessToken = notion.getNotionAccessToken();
        String parentPageId = notion.getNotionPageId();

        // 1) child page 생성
        Map<String, Object> createBody = Map.of(
                "parent", Map.of("type", "page_id", "page_id", parentPageId),
                "properties", Map.of(
                        "title", Map.of("title", List.of(
                                Map.of("type", "text", "text", Map.of("content", title))
                        ))
                )
        );

        Map created = notionApiClient.createPage(accessToken, createBody);
        String pageId = created.get("id") != null ? String.valueOf(created.get("id")) : null;

        // 2) blocks append (100개씩)
        if (pageId != null && blocks != null && !blocks.isEmpty()) {
            final int batchSize = 100;
            for (int i = 0; i < blocks.size(); i += batchSize) {
                int end = Math.min(i + batchSize, blocks.size());
                List<Map<String, Object>> batch = blocks.subList(i, end);

                Map<String, Object> appendBody = Map.of("children", batch);
                notionApiClient.appendChildren(accessToken, pageId, appendBody);
            }
        }

        // 3) Notion 페이지 URL(간단 버전)
        String url = pageId == null ? null : "https://www.notion.so/" + pageId.replace("-", "");

        return Map.of(
                "pageId", pageId,
                "url", url
        );
    }

    /**
     * 페이지 title 파싱은 워크스페이스마다 property key가 달라 일반화가 어렵습니다.
     * 일단 "Untitled" fallback으로 두고, 나중에 필요하면 개선하세요.
     */
    private String extractTitleFallback(Map page) {
        return "Untitled";
    }
}
