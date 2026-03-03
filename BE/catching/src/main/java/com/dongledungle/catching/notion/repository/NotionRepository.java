package com.dongledungle.catching.notion.repository;

import com.dongledungle.catching.notion.entity.Notion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotionRepository extends JpaRepository<Notion, Long> {
    Optional<Notion> findByUser_UserId(Long userId);
    boolean existsByUser_UserId(Long userId);
}
