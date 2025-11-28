package com.dongledungle.catching.analysis.service;

import com.dongledungle.catching.analysis.entity.AnalysisEntity;
import com.dongledungle.catching.analysis.repository.AnalysisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AnalysisService {
    private final AnalysisRepository analysisRepository;

    public Long saveAnalysisToDatabase(String company, String position, String analysisJson){
        AnalysisEntity entity = AnalysisEntity.builder()
                .company(company)
                .position(position)
                .content(analysisJson)
                .createdAt(LocalDateTime.now())
                .build();

        return analysisRepository.save(entity).getCompanyPositionId();
    }
}
