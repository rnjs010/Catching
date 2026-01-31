package com.dongledungle.catching.pdf.controller;

import com.dongledungle.catching.analysis.dto.AnalysisDetailResponseDto;
import com.dongledungle.catching.analysis.service.AnalysisService;
import com.dongledungle.catching.pdf.dto.PdfRequestDto;
import com.dongledungle.catching.pdf.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfExportService pdfExportService;
    private final AnalysisService analysisService;

    @PostMapping
    public ResponseEntity<byte[]> exportToPdf(@RequestBody PdfRequestDto request) {
        log.info("PDF 내보내기 요청: analysisId={}", request.getAnalysisId());
        try {
            AnalysisDetailResponseDto detail = analysisService.getAnalysisDetail(request.getAnalysisId());
            
            Map<String, Object> data = new java.util.HashMap<>(Map.of(
                    "company", detail.getCompany(),
                    "position", detail.getPosition(),
                    "today", detail.getCreatedAt().toLocalDate().toString(),
                    "year", String.valueOf(detail.getCreatedAt().getYear()),
                    "content", detail.getContent() != null ? detail.getContent() : ""
            ));

            byte[] pdfBytes = pdfExportService.exportAnalysisToPdf("pdf/report", data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                    .body(pdfBytes);
                    
        } catch (Exception e) {
            log.error("PDF 생성 중 오류 발생: analysisId={}", request.getAnalysisId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
