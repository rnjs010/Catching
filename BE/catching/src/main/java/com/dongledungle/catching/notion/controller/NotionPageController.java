package com.dongledungle.catching.notion.controller;

import com.dongledungle.catching.common.response.ApiResponse;
import com.dongledungle.catching.notion.dto.NotionPageDto;
import com.dongledungle.catching.notion.dto.request.NotionDefaultPageRequest;
import com.dongledungle.catching.notion.dto.response.NotionStatusResponse;
import com.dongledungle.catching.notion.service.NotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    private final NotionService notionService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<NotionStatusResponse>> getStatus(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(notionService.getStatus(Long.parseLong(userId))));
    }

    @GetMapping("/pages")
    public ResponseEntity<ApiResponse<Map<String, List<NotionPageDto>>>> getPages(@AuthenticationPrincipal String userId) {
        List<NotionPageDto> pages = notionService.getAccessiblePages(Long.parseLong(userId));
        return ResponseEntity.ok(ApiResponse.success(Map.of("pages", pages)));
    }

    @PutMapping("/default")
    public ResponseEntity<ApiResponse<Void>> setDefault(Authentication authentication, @RequestBody NotionDefaultPageRequest req) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());
        notionService.setDefaultPage(userId, req.pageId());
        return ResponseEntity.ok(ApiResponse.success("기본 페이지가 설정되었습니다"));
    }

    @DeleteMapping("/disconnect")
    public ResponseEntity<ApiResponse<Void>> disconnect(Authentication authentication) {
        Long userId = Long.parseLong((String) authentication.getPrincipal());
        notionService.disconnect(userId);
        return ResponseEntity.ok(ApiResponse.success("연동이 해제되었습니다"));
    }
}
