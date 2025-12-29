package com.dongledungle.catching.notion.controller;

import com.dongledungle.catching.notion.dto.request.NotionExportRequest;
import com.dongledungle.catching.notion.service.NotionExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Notion 내보내기 컨트롤러
 * - 기본 페이지 밑에 자식 페이지 생성 + blocks append
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notion")
public class NotionExportController {

    private final NotionExportService notionExportService;

    @PostMapping("/export")
    public Map<String, Object> export(Authentication authentication, @RequestBody NotionExportRequest req) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());

        String title = (req.getTitle() == null || req.getTitle().isBlank())
                ? "Export from Catching"
                : req.getTitle();

        return notionExportService.export(userId, title, req.getBlocks());
    }
}
