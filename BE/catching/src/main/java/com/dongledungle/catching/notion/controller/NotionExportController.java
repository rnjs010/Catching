package com.dongledungle.catching.notion.controller;

import com.dongledungle.catching.common.response.ApiResponse;
import com.dongledungle.catching.notion.dto.request.NotionExportRequest;
import com.dongledungle.catching.notion.dto.response.ExportResponse;
import com.dongledungle.catching.notion.service.NotionExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notion")
public class NotionExportController {

    private final NotionExportService notionExportService;

    @PostMapping("/export")
    public ResponseEntity<ApiResponse<ExportResponse>> export(
            @RequestBody NotionExportRequest request,
            @AuthenticationPrincipal String userId) {
        ExportResponse response = notionExportService.exportAnalysis(Long.parseLong(userId), request.analysisId());
        return ResponseEntity.ok(ApiResponse.success("내보내기가 완료되었습니다", response));
    }
}
