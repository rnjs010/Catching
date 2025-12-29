package com.dongledungle.catching.notion.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * /api/notion/oauth 응답
 * - Notion authorize 페이지로 이동할 URL을 반환
 */
@Getter
@AllArgsConstructor
public class NotionOauthUrlResponse {
    private String url;
}
