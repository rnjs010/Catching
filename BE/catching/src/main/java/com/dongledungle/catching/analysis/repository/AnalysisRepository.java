package com.dongledungle.catching.analysis.repository;

import com.dongledungle.catching.analysis.entity.AnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisRepository extends JpaRepository<AnalysisEntity, Long> {
    List<AnalysisEntity> findByCompany(String company);
    List<AnalysisEntity> findByCompanyAndPosition(String company, String position);
}
