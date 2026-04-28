package com.dongledungle.catching.ocr.controller;

import com.dongledungle.catching.common.response.ApiResponse;
import com.dongledungle.catching.ocr.dto.OcrResponseDto;
import com.dongledungle.catching.ocr.service.OcrService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Slf4j
@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;
    
    @Qualifier("ocrExecutor")
    private final Executor ocrExecutor;

    // 허용된 이미지 MIME 타입
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg", "image/png"
    );

    // 허용된 파일 최대 크기 (1MB)
    private static final long MAX_FILE_SIZE = 1024L * 1024L;

    @PostMapping("/extract")
    public CompletableFuture<ResponseEntity<ApiResponse<OcrResponseDto>>> extractText(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return CompletableFuture.completedFuture(ResponseEntity.badRequest()
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "잘못된 요청입니다.")));
        }

        // 파일 크기 체크
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("파일 크기 초과: {} bytes", file.getSize());
            return CompletableFuture.completedFuture(ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(ApiResponse.error(HttpStatus.PAYLOAD_TOO_LARGE.value(), "파일이 너무 큽니다.")));
        }

        // MIME 타입 체크
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            log.warn("허용되지 않은 MIME 타입 업로드 시도: {}", contentType);
            return CompletableFuture.completedFuture(ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body(ApiResponse.error(HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(), "허용되지 않는 파일입니다.")));
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown.png";

        // 파일명 정리
        final String safeFilename = originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");

        // 확장자 Whitelist
        String lowerFilename = safeFilename.toLowerCase();
        if (!lowerFilename.endsWith(".jpg") && !lowerFilename.endsWith(".jpeg") && !lowerFilename.endsWith(".png")) {
            log.warn("허용되지 않는 확장자 업로드 시도: {}", safeFilename);
            return CompletableFuture.completedFuture(ResponseEntity.badRequest()
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "허용되지 않는 파일입니다.")));
        }

        try {
            byte[] imageBytes = file.getBytes();

            // 실제 파일 이미지 디코딩 검증
            try (ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes)) {
                BufferedImage bImage = ImageIO.read(bais);
                if (bImage == null) {
                    log.error("실제 이미지 디코딩 실패 (가짜 파일): {}", safeFilename);
                    return CompletableFuture.completedFuture(ResponseEntity.badRequest()
                            .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "손상되었거나 유효하지 않은 이미지입니다.")));
                }
                
                // 해상도 제한
                if (bImage.getWidth() > 3000 || bImage.getHeight() > 4000) {
                    log.error("해상도 너무 큼: {} x {}", bImage.getWidth(), bImage.getHeight());
                    return CompletableFuture.completedFuture(ResponseEntity.badRequest()
                            .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "손상되었거나 유효하지 않은 이미지입니다.")));
                }
            } catch (Exception ex) {
                log.error("이미지 검증 중 예외 발생: {}", ex.getMessage());
                return CompletableFuture.completedFuture(ResponseEntity.badRequest()
                        .body(ApiResponse.error(HttpStatus.BAD_REQUEST.value(), "손상되었거나 유효하지 않은 이미지입니다.")));
            }

            // ForkJoinPool 혼잡 회피를 위해 전용 Executor를 통한 분리 비동기 처리
            return CompletableFuture.supplyAsync(() -> {
                try {
                    String extractedText = ocrService.extractTextFromImage(imageBytes, safeFilename);

                    OcrResponseDto responseDto = OcrResponseDto.builder()
                            .text(extractedText)
                            .build();

                    return ResponseEntity.ok(ApiResponse.success("OCR 텍스트 추출 완료", responseDto));
                } catch (Exception e) {
                    log.error("OCR 텍스트 추출 중 오류 발생", e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "서버 오류가 발생했습니다."));
                }
            }, ocrExecutor);

        } catch (Exception e) {
            log.error("파일 바이트 읽기 실패", e);
            return CompletableFuture.completedFuture(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "파일 처리 중 예외가 발생했습니다.")));
        }
    }
}


