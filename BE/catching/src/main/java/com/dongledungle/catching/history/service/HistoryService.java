package com.dongledungle.catching.history.service;

import com.dongledungle.catching.common.util.WeekUtil;
import com.dongledungle.catching.history.dto.HistoryDto;
import com.dongledungle.catching.history.entity.History;
import com.dongledungle.catching.history.repository.HistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HistoryService {
    private final HistoryRepository historyRepository;

    /**
     * 유저의 히스토리 내역 조회(최근 한달)
     */
    public List<HistoryDto> getHistory(Long userId){
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);

        List<Object[]> results = historyRepository.findRecentHistoryWithCompanyPosition(userId, oneMonthAgo);

        return results.stream()
                .map(row -> HistoryDto.builder()
                        .historyId(((History) row[0]).getHistoryId())
                        .companyPositionId(((History) row[0]).getCompanyPositionId())
                        .company((String) row[1])
                        .position((String) row[2])
                        .createdAt(((History) row[0]).getCreatedAt())
                        .build())
                .toList();
    }

    /**
     * 사용자 조회 기록 저장
     */
    @Transactional
    public void saveHistory(Long userId, Long companyPositionId){
        String currentMonthWeek = WeekUtil.getCurrentYearMonthWeek();

        // 조회 기록 저장
        History history = History.builder()
                .userId(userId)
                .companyPositionId(companyPositionId)
                .yearMonthWeek(currentMonthWeek)
                .createdAt(LocalDateTime.now())
                .build();

        historyRepository.save(history);
        log.info("History 저장: userId={}, companyPositionId={}, week={}",
                userId, companyPositionId, currentMonthWeek);
    }
}
