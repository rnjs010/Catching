package com.dongledungle.catching.notion.entity;

import com.dongledungle.catching.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notion {

    /**
     * PK = user_id (notion 테이블의 PK)
     * users.user_id와 동일한 값을 사용합니다.
     */
    @Id
    @Column(name = "user_id")
    private Long userId;

    /**
     * user_id를 User의 PK와 공유하는 1:1 관계
     * - notion row 1개 = user 1명
     */
    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "notion_access_token", nullable = false, length = 2000)
    private String notionAccessToken;

    /**
     * 현재 DB 스키마가 NOT NULL이라서,
     * Notion OAuth 응답에 refresh_token이 없으면 저장이 불가능합니다.
     */
    @Column(name = "notion_refresh_token", nullable = false, length = 2000)
    private String notionRefreshToken;

    /**
     * DB가 NOT NULL이므로, 최초 연동 시에는 "UNSET" 임시값을 넣고
     * 사용자가 페이지 선택하면 실제 pageId로 업데이트합니다.
     */
    @Column(name = "notion_page_id", nullable = false)
    private String notionPageId;

    @Column(name = "notion_page_name")
    private String notionPageName;

    @Column(name = "notion_workspace_id")
    private String notionWorkspaceId;

    @Column(name = "notion_workspace_name")
    private String notionWorkspaceName;

    @Column(name = "notion_bot_id")
    private String notionBotId;

    // -------- 편의 메서드 --------
    public boolean hasDefaultPage() {
        return notionPageId != null && !"UNSET".equals(notionPageId) && !notionPageId.isBlank();
    }
}
