package com.dongledungle.catching.search.service;

// import com.dongledungle.catching.common.config.AnalysisSchema;
import com.google.common.collect.ImmutableList;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import com.google.genai.types.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("classpath:prompts/prompt-company-position-search.st")
    private Resource companyPositionSearchPromptResource;

    public String loadSearchPrompt(){
        try{
            return new String(FileCopyUtils.copyToByteArray(companyPositionSearchPromptResource.getInputStream()), StandardCharsets.UTF_8);
        }catch(IOException e){
            log.error("Failed to load prompt template");
            throw new RuntimeException("Failed to load prompt template", e);
        }
    }

    private final Gson gson = new Gson();

    public ResponseStream<GenerateContentResponse> analyzeCompany(String today, String company, String position, String analysisDepth) {
        Client client = Client.builder().apiKey(apiKey).build();

        List<Tool> tools = new ArrayList<>();
        // tools.add(
        //   Tool.builder()
        //     .urlContext(
        //       UrlContext.builder().build()
        //     )
        //     .build()
        // );
        tools.add(
          Tool.builder()
            .googleSearch(
              GoogleSearch.builder()
                  .build())
                .build()
        );

        String model = "gemini-flash-latest";

        JsonObject userInput = new JsonObject();
        userInput.addProperty("today", today);
        userInput.addProperty("company", company);
        userInput.addProperty("position", position);
        userInput.addProperty("analysisDepth", analysisDepth);
        String userMessage = gson.toJson(userInput);

        List<Content> contents = ImmutableList.of(
          Content.builder()
            .role("user")
            .parts(ImmutableList.of(
              Part.fromText(userMessage)
            ))
            .build()
        );

        // Schema analysisSchema = AnalysisSchema.getSchema(); 

        GenerateContentConfig config =
            GenerateContentConfig
            .builder()
            .thinkingConfig(
                ThinkingConfig
                    .builder()
                    .thinkingBudget(0) 
                    .build()
            )
            .tools(tools)
            // .responseMimeType("application/json")  // 구글 서치 툴과 응답형식 강제 동시 사용 불가
            // .responseSchema(analysisSchema)
            .systemInstruction(
                Content
                    .fromParts(
                        Part.fromText(loadSearchPrompt())
                    )
            )
            .build();

        return client.models.generateContentStream(model, contents, config);
    }
}
