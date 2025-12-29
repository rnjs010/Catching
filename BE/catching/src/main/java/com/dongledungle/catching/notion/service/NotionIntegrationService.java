package com.dongledungle.catching.notion.service;

import com.dongledungle.catching.auth.entity.User;
import com.dongledungle.catching.auth.repository.UserRepository;
import com.dongledungle.catching.notion.entity.Notion;
import com.dongledungle.catching.notion.repository.NotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Notion(DB) 연동 정보 관리 서비스
 *
 * 역할:
 * - tokenResponse를 Notion 엔티티에 저장(유저당 1행)
 * - 기본 페이지(pageId/pageTitle) 저장
 * - 연결 상태 조회 / 연동 해제
 */
@Service
@RequiredArgsConstructor
public class NotionIntegrationService {

    private static final String UNSET_PAGE_ID = "UNSET";

    private final UserRepository userRepository;
    private final NotionRepository notionRepository;

    @Transactional
    public void saveToken(Long userId, Map<String, Object> tokenResponse) {
        String accessToken = (String) tokenResponse.get("access_token");
        String refreshToken = (String) tokenResponse.get("refresh_token"); // DB NOT NULL이면 반드시 필요

        // 토큰 응답에서 얻을 수 있는 부가 정보(있으면 저장)
        String workspaceId = tokenResponse.get("workspace_id") != null ? String.valueOf(tokenResponse.get("workspace_id")) : null;
        String workspaceName = tokenResponse.get("workspace_name") != null ? String.valueOf(tokenResponse.get("workspace_name")) : null;
        String botId = tokenResponse.get("bot_id") != null ? String.valueOf(tokenResponse.get("bot_id")) : null;

        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalStateException("Notion access_token을 받지 못했습니다.");
        }

        // ⚠️ DB 스키마가 refresh_token NOT NULL이면, 이 값이 없을 때 저장 불가
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalStateException("Notion refresh_token을 받지 못했습니다. (DB 스키마/응답 확인 필요)");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저가 존재하지 않습니다. userId=" + userId));

        Notion notion = notionRepository.findByUser_UserId(userId)
                .orElseGet(() -> Notion.builder()
                        .user(user)
                        .notionAccessToken(accessToken)
                        .notionRefreshToken(refreshToken)
                        .notionPageId(UNSET_PAGE_ID) // 페이지 선택 전 임시값
                        .build());

        // 기존 row가 있으면 갱신
        notion.setUser(user);
        notion.setNotionAccessToken(accessToken);
        notion.setNotionRefreshToken(refreshToken);
        notion.setNotionWorkspaceId(workspaceId);
        notion.setNotionWorkspaceName(workspaceName);
        notion.setNotionBotId(botId);

        // NOT NULL 방어
        if (notion.getNotionPageId() == null || notion.getNotionPageId().isBlank()) {
            notion.setNotionPageId(UNSET_PAGE_ID);
        }

        notionRepository.save(notion);
    }

    @Transactional(readOnly = true)
    public Notion getOrThrow(Long userId) {
        return notionRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new IllegalStateException("Notion이 연동되어 있지 않습니다."));
    }

    @Transactional(readOnly = true)
    public boolean isConnected(Long userId) {
        return notionRepository.existsByUser_UserId(userId);
    }

    @Transactional
    public void setDefaultPage(Long userId, String pageId, String pageTitle) {
        if (pageId == null || pageId.isBlank()) {
            throw new IllegalArgumentException("pageId는 필수입니다.");
        }

        Notion notion = getOrThrow(userId);
        notion.setNotionPageId(pageId);
        notion.setNotionPageName(pageTitle);

        notionRepository.save(notion);
    }

    @Transactional
    public void disconnect(Long userId) {
        // 현재 스키마는 토큰이 NOT NULL이라 "null로 초기화"가 불가 → row 삭제가 가장 깔끔
        Notion notion = getOrThrow(userId);
        notionRepository.delete(notion);
    }
}
