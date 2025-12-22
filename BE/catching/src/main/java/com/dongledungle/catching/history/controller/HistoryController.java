package com.dongledungle.catching.history.controller;

import com.dongledungle.catching.auth.common.ApiResponse;
import com.dongledungle.catching.history.dto.HistoryDto;
import com.dongledungle.catching.history.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {
    private final HistoryService historyService;

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<HistoryDto>>> getHistoryList(Authentication authentication){
        long userId = Long.parseLong((String) authentication.getPrincipal());
        List<HistoryDto> history = historyService.getHistory(userId);
        return ResponseEntity.ok(
                ApiResponse.success("유저의 최근 한 달 History", history)
        );
    }
}
