package com.dongledungle.catching.history.repository;

import com.dongledungle.catching.history.entity.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<History, Long> {
    // 특정 주차의 인기 Top 5 조회
    @Query("""
            SELECT h.companyPositionId, COUNT(h) as viewCount
            FROM history h
            WHERE h.yearMonthWeek = :yearMonthWeek
            GROUP BY h.companyPositionId
            ORDER BY COUNT(h) DESC
            LIMIT 5
            """)
    List<Object[]> findTop5ByYearWeek(@Param("yearMonthWeek") String yearMonthWeek);

    // 특정 직무정보 ID의 조회수 조회
    long countByCompanyPositionIdAndYearMonthWeek(Long companyPositionId, String yearMonthWeek);

    @Query("""
            SELECT h, a.company, a.position
            FROM history h
                JOIN analysis a ON h.companyPositionId = a.companyPositionId
            WHERE h.userId = :userId
                AND h.createdAt >= :oneMonthAgo
            ORDER BY h.createdAt DESC
            """
    )
    List<Object[]> findRecentHistoryWithCompanyPosition(
            @Param("userId") Long userId,
            @Param("oneMonthAgo") LocalDateTime oneMonthAgo
    );
}
