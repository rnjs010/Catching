package com.dongledungle.catching.notion.dto.request;

import lombok.Getter;
import lombok.Setter;

/**
 * 사용자가 선택한 기본(부모) 페이지를 저장하기 위한 요청 DTO
 */
@Getter
@Setter
public class NotionDefaultPageRequest {
    private String pageId;
    private String pageTitle; // 선택: 프론트가 보내주면 저장해서 UI에 표시하기 좋음
}
