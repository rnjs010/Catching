package com.dongledungle.catching.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "google_id", nullable = false)
    private String googleId;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(nullable = false)
    private String email;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(nullable = false)
    private String role = "ROLE_USER";

    // ---------- 비즈니스 메서드들 ---------- //


    public void updateUserName(String userName) {
        this.userName = userName;
    }

    public void softDelete() {
        this.isDeleted = true;
    }
}
