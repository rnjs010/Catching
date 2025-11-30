package com.dongledungle.catching.analysis.repository;

import com.dongledungle.catching.analysis.entity.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    List<Analysis> findByCompany(String company);
    List<Analysis> findByCompanyAndPosition(String company, String position);
    // 특정 주차에 생성된 분석 조회
    @Query("""
            SELECT a
            FROM analysis a
            WHERE a.company = :company
            AND a.position = :position
            AND a.createdAt >= :weekStart
            AND a.createdAt < :weekEnd
            ORDER BY a.createdAt DESC
            LIMIT 1
            """)
    Optional<Analysis> findByCompanyAndPositionInWeek(
            @Param("company") String company,
            @Param("position") String position,
            @Param("weekStart")LocalDateTime weekStart,
            @Param("weekEnd") LocalDateTime weekEnd
    );
}
