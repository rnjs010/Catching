package com.dongledungle.catching.analysis.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Table
@Entity(name = "analysis")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalysisEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_position_id")  // DB 컬럼명 명시
    private Long companyPositionId;  // Java는 camelCase

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String position;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate(){
        this.updatedAt = LocalDateTime.now();
    }

}
