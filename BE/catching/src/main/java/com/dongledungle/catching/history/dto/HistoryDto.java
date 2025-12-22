package com.dongledungle.catching.history.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryDto {
    private Long historyId;
    private Long companyPositionId;
    private String company;
    private String position;
    private LocalDateTime createdAt;
}
