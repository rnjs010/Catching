package com.dongledungle.catching.history.entity;

import com.dongledungle.catching.analysis.entity.Analysis;
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

    @Column(name = "is_deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean isDeleted = false;

    public void markAsDeleted() {
        this.isDeleted = true;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_position_id", insertable = false, updatable = false)
    private Analysis analysis;
}
