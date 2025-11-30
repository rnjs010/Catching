package com.dongledungle.catching.history.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Table
@Entity(name = "history")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class History {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="history_id")
    private Long historyId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name="company_position_id", nullable = false)
    private Long companyPositionId;

    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name="year_month_week", nullable = false)
    private String yearMonthWeek; //"2025-11-W3" (2025년 11월 3주차)


}
