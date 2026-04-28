package com.dongledungle.catching.ocr.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Value("${ocr.fastapi.url}")
    private String fastApiUrl;

    @org.springframework.beans.factory.annotation.Value("${ocr.tesseract.datapath}")
    private String tessDataPath;

    @org.springframework.beans.factory.annotation.Value("${ocr.tesseract.language}")
    private String tessLanguage;

    /**
     * OCR 요청 처리 (1차: FastAPI PaddleOCR -> 2차: Tesseract Fallback)
     * @param imageBytes 업로드된 이미지 바이트 데이터
     * @param filename 이미지 파일 이름
     * @return 추출된 텍스트
     */
    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "fastApiOcr", fallbackMethod = "fallbackTesseract")
    public String extractTextFromImage(byte[] imageBytes, String filename) {
        log.info("Starting OCR process for image: {}", filename);
        
        // 1차 시도: FastAPI(PaddleOCR) 호출
        String fastApiResult = callFastApiOcr(imageBytes, filename);
        if (fastApiResult != null && !fastApiResult.trim().isEmpty()) {
            log.info("FastAPI OCR extraction successful.");
            return fastApiResult;
        } else {
            throw new RuntimeException("FastAPI returned empty result.");
        }
    }

    // FastAPI 에러 생기거나 Circuit 이 Open 되었을 때 자동 실행되는 Fallback 메서드
    public String fallbackTesseract(byte[] imageBytes, String filename, Throwable t) {
        log.error("CircuitBreaker Fallback Activated -> Reason: {}. Falling back to Tesseract OCR.", t.getMessage());
        return callTesseractFallback(imageBytes);
    }

    // PaddleOCR 호출해서 인식 결과 가져옴
    private String callFastApiOcr(byte[] imageBytes, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(fastApiUrl, requestEntity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                if ("success".equals(jsonNode.path("status").asText())) {
                    return jsonNode.path("text").asText();
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to parse FastAPI response", e);
            }
        }
        
        throw new RuntimeException("FastAPI returned non-success status or empty body.");
    }

    // Tesseract OCR를 직접 실행해서 문자열 추출
    private String callTesseractFallback(byte[] imageBytes) {
        log.info("Executing Tesseract OCR Fallback...");
        try {
            // 바이트 배열을 BufferedImage로 변환
            ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes);
            BufferedImage image = ImageIO.read(bais);

            if (image == null) {
                log.error("Could not read image for Tesseract.");
                return "";
            }

            Tesseract tesseract = new Tesseract();
            // 언어 설정 (한국어+영어 혼합)
            tesseract.setLanguage(tessLanguage);
            // Page Seg Mode: 6 (블록 단위)
            tesseract.setPageSegMode(6);
            // 데이터 경로 지정
            tesseract.setDatapath(tessDataPath);

            String result = tesseract.doOCR(image);
            log.info("Tesseract OCR completed via Fallback.");
            return result;
        } catch (IOException | TesseractException e) {
            log.error("Tesseract OCR Fallback failed: {}", e.getMessage(), e);
            return ""; // 최종 실패 시 빈 문자열 반환
        }
    }
}
