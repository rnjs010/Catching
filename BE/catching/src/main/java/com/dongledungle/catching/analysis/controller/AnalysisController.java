package com.dongledungle.catching.analysis.controller;

import com.dongledungle.catching.analysis.dto.AnalysisRequestDto;
import com.dongledungle.catching.analysis.service.GeminiService;
import com.dongledungle.catching.analysis.service.NotionService;
import com.google.genai.ResponseStream;
import com.google.genai.types.GenerateContentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnalysisController {

    private final GeminiService geminiService;
    private final NotionService notionService;

    @PostMapping(value = "/analysis", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyze(@RequestBody AnalysisRequestDto request) {
        SseEmitter emitter = new SseEmitter(600000L); 
        
        StringBuilder finalJsonResponse = new StringBuilder();

        try {
            ResponseStream<GenerateContentResponse> responseStream = 
                    geminiService.analyzeCompany(
                        request.getToday(),
                        request.getCompany(),
                        request.getPosition(),
                        request.getAnalysisDepth()
                    );

            for (GenerateContentResponse response : responseStream) {
                try {
                    String textChunk = response.candidates().get().get(0).content().get().parts().get().get(0).text().get();
                    
                    finalJsonResponse.append(textChunk); 
                    
                    emitter.send(SseEmitter.event().name("data").data(textChunk));
                    emitter.send(SseEmitter.event().comment("flush"));
                } catch (IOException e) {
                    System.err.println("SSE Client Write Error: " + e.getMessage());
                    emitter.completeWithError(e);
                    return emitter;
                }
            }

            String rawJson = finalJsonResponse.toString();
            // String finalJson = finalJsonResponse.toString();
            int startIndex = rawJson.indexOf('{');
            int endIndex = rawJson.lastIndexOf('}');

            String finalJson = "";

            if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
                finalJson = rawJson.substring(startIndex, endIndex + 1); 
            } else {
                System.err.println("JSON Parsing Error: Cannot find valid JSON object boundary in stream output.");
                emitter.completeWithError(new RuntimeException("AI analysis failed to return valid JSON object."));
                return emitter;
            }

//            String pageId = notionService.createPageFromAnalysis(finalJson);
//
//            emitter.send(SseEmitter.event()
//                    .name("notionComplete")
//                    .data(pageId)
//                    .reconnectTime(1000L)
//            );
//
//            emitter.complete();

        } catch (Exception e) {
            System.err.println("Analysis/Notion Streaming Error: " + e.getMessage());
            emitter.completeWithError(e);
        }

        return emitter;
    }

    @PostMapping("/analysis/raw")
    public ResponseEntity<String> analyzeRaw(@RequestBody AnalysisRequestDto request){
        try{
            ResponseStream<GenerateContentResponse> responseStream =
                    geminiService.analyzeCompany(
                            request.getToday(),
                            request.getCompany(),
                            request.getPosition(),
                            request.getAnalysisDepth()
                    );

            StringBuilder rawResponse = new StringBuilder();

            for(GenerateContentResponse response : responseStream){
                String textChunk = response.candidates().get().get(0)
                        .content().get().parts().get().get(0).text().get();
                rawResponse.append(textChunk);
            }

            // 파싱 없이 그대로 반환
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(rawResponse.toString());
        }catch (Exception e) {
            log.error("Raw Analysis Error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}