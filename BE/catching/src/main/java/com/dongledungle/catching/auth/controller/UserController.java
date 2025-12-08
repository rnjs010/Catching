package com.dongledungle.catching.auth.controller;

import com.dongledungle.catching.auth.common.ApiResponse;
import com.dongledungle.catching.auth.entity.User;
import com.dongledungle.catching.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 정보 관리 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 사용자 정보 조회
     * GET /api/users/{userId}
     *
     * @param userId 사용자 ID
     * @return ApiResponse<User>
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<User>> getUserInfo(@PathVariable Long userId) {
        try {
            User user = userService.findById(userId);
            return ResponseEntity.ok(ApiResponse.success(user));
        } catch (Exception e) {
            log.error("사용자 정보 조회 실패: userId={}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("사용자 정보를 찾을 수 없습니다."));
        }
    }

    /**
     * 노션 정보 업데이트
     * PUT /api/users/{userId}/notion
     *
     * @param userId 사용자 ID
     * @param notionApiKey 노션 API 키
     * @param notionPageId 노션 페이지 ID
     * @return ApiResponse<String>
     */
    @PutMapping("/{userId}/notion")
    public ResponseEntity<ApiResponse<String>> updateNotionInfo(
            @PathVariable Long userId,
            @RequestParam String notionApiKey,
            @RequestParam String notionPageId) {
        try {
            userService.updateNotionInfo(userId, notionApiKey, notionPageId);
            return ResponseEntity.ok(ApiResponse.success("노션 정보가 업데이트되었습니다."));
        } catch (Exception e) {
            log.error("노션 정보 업데이트 실패: userId={}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("노션 정보 업데이트에 실패했습니다."));
        }
    }

    /**
     * 사용자 이름 수정
     * PATCH /api/users/{userId}/name
     *
     * @param userId 사용자 ID
     * @param userName 새 사용자 이름
     * @return ApiResponse<String>
     */
    @PatchMapping("/{userId}/name")
    public ResponseEntity<ApiResponse<String>> updateUserName(
            @PathVariable Long userId,
            @RequestParam String userName) {
        try {
            userService.updateUserName(userId, userName);
            return ResponseEntity.ok(ApiResponse.success("사용자 이름이 수정되었습니다."));
        } catch (Exception e) {
            log.error("사용자 이름 수정 실패: userId={}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("사용자 이름 수정에 실패했습니다."));
        }
    }

    /**
     * 사용자 삭제 (소프트 삭제)
     * DELETE /api/users/{userId}
     *
     * @param userId 사용자 ID
     * @return ApiResponse<String>
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok(ApiResponse.success("사용자가 삭제되었습니다."));
        } catch (Exception e) {
            log.error("사용자 삭제 실패: userId={}", userId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("사용자 삭제에 실패했습니다."));
        }
    }
}