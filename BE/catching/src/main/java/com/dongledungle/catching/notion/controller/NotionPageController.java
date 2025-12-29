package com.dongledungle.catching.notion.controller;

import com.dongledungle.catching.notion.dto.request.NotionDefaultPageRequest;
import com.dongledungle.catching.notion.dto.response.NotionPageItemResponse;
import com.dongledungle.catching.notion.dto.response.NotionStatusResponse;
import com.dongledungle.catching.notion.entity.Notion;
import com.dongledungle.catching.notion.service.NotionExportService;
import com.dongledungle.catching.notion.service.NotionIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Notion 설정 관련 컨트롤러
 * - status: 연결 여부 + 기본 페이지 설정 여부
 * - pages: 최상위 페이지 목록
 * - default: 기본 페이지 저장
 * - disconnect: 연동 해제
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notion")
public class NotionPageController {

    private final NotionIntegrationService notionIntegrationService;
    private final NotionExportService notionExportService;

    @GetMapping("/status")
    public NotionStatusResponse status(Authentication authentication) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());

        boolean connected = notionIntegrationService.isConnected(userId);
        if (!connected) {
            return new NotionStatusResponse(false, false, null, null, null, null, null);
        }

        Notion notion = notionIntegrationService.getOrThrow(userId);

        return new NotionStatusResponse(
                true,
                notion.hasDefaultPage(),
                notion.getNotionPageId(),
                notion.getNotionPageName(),
                notion.getNotionWorkspaceId(),
                notion.getNotionWorkspaceName(),
                notion.getNotionBotId()
        );
    }

    @GetMapping("/pages")
    public List<NotionPageItemResponse> pages(Authentication authentication) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());
        return notionExportService.getTopLevelPages(userId);
    }

    @PutMapping("/default")
    public void setDefault(Authentication authentication, @RequestBody NotionDefaultPageRequest req) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());
        notionIntegrationService.setDefaultPage(userId, req.getPageId(), req.getPageTitle());
    }

    @DeleteMapping("/disconnect")
    public void disconnect(Authentication authentication) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());
        notionIntegrationService.disconnect(userId);
    }
}
