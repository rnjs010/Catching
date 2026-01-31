package com.dongledungle.catching.notion.service;

import com.dongledungle.catching.auth.entity.User;
import com.dongledungle.catching.auth.repository.UserRepository;
import com.dongledungle.catching.notion.client.NotionApiClient;
import com.dongledungle.catching.notion.dto.NotionPageDto;
import com.dongledungle.catching.notion.dto.response.NotionStatusResponse;
import com.dongledungle.catching.notion.entity.Notion;
import com.dongledungle.catching.notion.repository.NotionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Notion(DB) 연동 정보 관리 서비스
 *
 * 역할:
 * - tokenResponse를 Notion 엔티티에 저장(유저당 1행)
 * - 기본 페이지(pageId/pageTitle) 저장
 * - 연결 상태 조회 / 연동 해제
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotionService {
    private final UserRepository userRepository;
    private final NotionRepository notionRepository;
    private final NotionApiClient notionApiClient;

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
                        .notionBotId(botId)
                        .notionWorkspaceId(workspaceId)
                        .notionWorkspaceName(workspaceName)
                        .notionDefaultPageId("")
                        .build());

        // 기존 row가 있으면 갱신
        notion.setUser(user);
        notion.setNotionAccessToken(accessToken);
        notion.setNotionRefreshToken(refreshToken);
        notion.setNotionWorkspaceId(workspaceId);
        notion.setNotionWorkspaceName(workspaceName);
        notion.setNotionBotId(botId);

        // NOT NULL 방어
        if (notion.getNotionDefaultPageId() == null || notion.getNotionDefaultPageId().isBlank()) {
            notion.setNotionDefaultPageId("");
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

    public List<NotionPageDto> getAccessiblePages(Long userId) {
        User user = getUser(userId);
        validateConnected(user);
        String accessToken = user.getNotion().getNotionAccessToken();

        Map<String, Object> body = Map.of(
                "filter", Map.of("property", "object", "value", "page"),
                "page_size", 100
        );

        Map response = notionApiClient.search(accessToken, body);

        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");

        return results.stream()
                .filter(result -> {
                    Map<String, Object> parent = (Map<String, Object>) result.get("parent");
                    return parent != null && "workspace".equals(parent.get("type"));
                })
                .map(this::toPageDto)
                .toList();
    }

    public NotionStatusResponse getStatus(Long userId) {
        User user = getUser(userId);
        Notion notion = user.getNotion();

        return new NotionStatusResponse(
                user.isNotionConnected(),
                user.hasDefaultPage(),
                notion != null ? notion.getNotionDefaultPageId() : null,
                notion != null ? notion.getNotionDefaultPageName() : null,
                notion != null ? notion.getNotionWorkspaceName() : null
        );
    }



    @Transactional
    public void setDefaultPage(Long userId, String pageId) {
        User user = getUser(userId);
        validateConnected(user);

        Map response = notionApiClient.fetchPageTitle(user.getNotion().getNotionAccessToken(), pageId);
        String title = extractTitle((Map<String, Object>) response.get("properties"));
        user.getNotion().updateDefaultPage(pageId, title);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다"));
    }

    private void validateConnected(User user) {
        if (!user.isNotionConnected()) {
            throw new IllegalStateException("Notion 연동이 필요합니다");
        }
    }

    @Transactional
    public void disconnect(Long userId) {
        // 현재 스키마는 토큰이 NOT NULL이라 "null로 초기화"가 불가 → row 삭제가 가장 깔끔
        Notion notion = getOrThrow(userId);
        notionRepository.delete(notion);
    }

    private NotionPageDto toPageDto(Map<String, Object> result) {
        String id = (String) result.get("id");
        String title = extractTitle((Map<String, Object>) result.get("properties"));
        String icon = extractIcon(result.get("icon"));
        return new NotionPageDto(id, title, icon);
    }

    private String extractTitle(Map<String, Object> properties) {
        try {
            for (Map.Entry<String, Object> entry : properties.entrySet()) {
                Map<String, Object> prop = (Map<String, Object>) entry.getValue();
                if ("title".equals(prop.get("type"))) {
                    List<Map<String, Object>> titleArray = (List<Map<String, Object>>) prop.get("title");
                    if (titleArray != null && !titleArray.isEmpty()) {
                        Map<String, Object> textObj = (Map<String, Object>) titleArray.get(0).get("text");
                        return (String) textObj.get("content");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("제목 추출 실패", e);
        }
        return "Untitled";
    }

    private String extractIcon(Object icon) {
        if (icon instanceof Map) {
            Map<String, Object> iconMap = (Map<String, Object>) icon;
            if ("emoji".equals(iconMap.get("type"))) {
                return (String) iconMap.get("emoji");
            }
        }
        return "📄";
    }
}
