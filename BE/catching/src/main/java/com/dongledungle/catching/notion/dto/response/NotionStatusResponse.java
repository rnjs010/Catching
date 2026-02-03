package com.dongledungle.catching.notion.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 프론트에서 연동 상태 표시용 응답
 */
@Getter
@AllArgsConstructor
public class NotionStatusResponse {
    private boolean connected;
    private boolean hasDefaultPage;
    private String defaultPageId;
    private String defaultPageTitle;
    private String workspaceName;
}
