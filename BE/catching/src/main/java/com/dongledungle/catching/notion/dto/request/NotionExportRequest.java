package com.dongledungle.catching.notion.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * Notion 내보내기 요청 DTO
 * - title: 생성될 자식 페이지 제목
 * - blocks: Notion block(children) JSON 배열
 *
 * (추후 analysisId 기반으로 서버가 blocks를 만들게 변경해도 됩니다.)
 */
@Getter
@Setter
public class NotionExportRequest {
    private String title;
    private List<Map<String, Object>> blocks;
}
