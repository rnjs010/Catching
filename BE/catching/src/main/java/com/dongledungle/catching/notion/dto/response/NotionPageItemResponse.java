package com.dongledungle.catching.notion.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 페이지 목록 item 응답
 */
@Getter
@AllArgsConstructor
public class NotionPageItemResponse {
    private String id;
    private String title;
}
