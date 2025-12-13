package com.dongledungle.catching.auth.repository;

import com.dongledungle.catching.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * User 엔티티 데이터 접근 Repository
 * JPA를 통해 데이터베이스 CRUD 작업 수행
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 구글 ID + 삭제되지 않은 사용자 조회
     */
    Optional<User> findByGoogleIdAndIsDeletedFalse(String googleId);

    /**
     * 이메일 중복 체크
     */
    boolean existsByEmail(String email);
}
