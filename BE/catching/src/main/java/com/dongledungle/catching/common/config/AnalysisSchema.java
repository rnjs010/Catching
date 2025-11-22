package com.dongledungle.catching.common.config;

import com.google.genai.types.Schema;
import com.google.genai.types.Type;

import java.util.Map;

public class AnalysisSchema {
    public static Schema getSchema() {
        
        // --- Level 5 & 4: Issue Detail (가장 안쪽의 긍정/부정 이슈 객체) ---
        Schema issueDetailSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "title", Schema.builder().type(Type.Known.STRING).build(),
                        "date", Schema.builder().type(Type.Known.STRING).build(), // YYYY-MM-DD
                        "summary", Schema.builder().type(Type.Known.STRING).build(),
                        "url", Schema.builder().type(Type.Known.STRING).build() // HTTPS 필수
                ))
                .build();
                
        // --- Level 3: Recent Issues 스키마 (company.summary.recent_issues 내부) ---
        Schema recentIssuesSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "positive", Schema.builder().type(Type.Known.ARRAY).items(issueDetailSchema).build(),
                        "negative", Schema.builder().type(Type.Known.ARRAY).items(issueDetailSchema).build()
                ))
                .build();
        
        // --- Level 3: Core Business Item 스키마 (core_business ARRAY 내부) ---
        Schema coreBusinessItemSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "core_name", Schema.builder().type(Type.Known.STRING).build(),
                        "core_description", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.STRING).build()).build(),
                        "core_url", Schema.builder().type(Type.Known.STRING).build()
                ))
                .build();
        
        // --- Level 3: Competitor Item 스키마 (competitors ARRAY 내부) ---
        Schema competitorSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "name", Schema.builder().type(Type.Known.STRING).build(),
                        "strength", Schema.builder().type(Type.Known.STRING).build(),
                        "market_position", Schema.builder().type(Type.Known.STRING).build(),
                        "core_business", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.STRING).build()).build(),
                        "recent_issues", recentIssuesSchema // 중첩 스키마 사용
                ))
                .build();
        
        // --- Level 4: Notion Subsections 스키마 ---
        Schema subsectionSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "h3", Schema.builder().type(Type.Known.STRING).build(),
                        "content", Schema.builder().type(Type.Known.STRING).build()
                ))
                .build();

        // --- Level 3: Notion Sections 스키마 ---
        Schema sectionSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "h2", Schema.builder().type(Type.Known.STRING).build(),
                        "subsections", Schema.builder()
                                .type(Type.Known.ARRAY)
                                .items(subsectionSchema) // 중첩 스키마 사용
                                .build()
                ))
                .build();
        
        // --- Level 3: Position Summary 스키마 (position.summary 내부) ---
        Schema positionSummarySchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "job_description", Schema.builder().type(Type.Known.STRING).build(),
                        "position_core_business", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.STRING).build()).build(),
                        "industry_trends", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.STRING).build()).build(),
                        "job_outlook", Schema.builder().type(Type.Known.STRING).build()
                ))
                .build();

        // --- Level 3: Company Status 스키마 (company.summary.basic_info.status 내부) ---
        Schema statusSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "founded", Schema.builder().type(Type.Known.STRING).build(),
                        "headquarters", Schema.builder().type(Type.Known.STRING).build(),
                        "employees", Schema.builder().type(Type.Known.STRING).build(),
                        "revenue", Schema.builder().type(Type.Known.STRING).build()
                ))
                .build();
                
        // --- Level 2: Company Basic Info 스키마 (company.summary.basic_info 내부) ---
        Schema basicInfoSchema = Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "name", Schema.builder().type(Type.Known.STRING).build(),
                        "description", Schema.builder().type(Type.Known.STRING).build(),
                        "status", statusSchema, // 중첩 스키마
                        "industry", Schema.builder().type(Type.Known.STRING).build(),
                        "business_areas", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.STRING).build()).build(),
                        "company_characteristics", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.STRING).build()).build()
                ))
                .build();

        // --- Level 1: Root Level Properties ---
        return Schema.builder()
                .type(Type.Known.OBJECT)
                .properties(Map.of(
                        "company", Schema.builder()
                                .type(Type.Known.OBJECT)
                                .properties(Map.of(
                                        "summary", Schema.builder()
                                                .type(Type.Known.OBJECT)
                                                .properties(Map.of(
                                                        "basic_info", basicInfoSchema, // 중첩 스키마
                                                        "core_business", Schema.builder().type(Type.Known.ARRAY).items(coreBusinessItemSchema).build(), // ARRAY of OBJECTS
                                                        "competitors", Schema.builder().type(Type.Known.ARRAY).items(competitorSchema).build(), // ARRAY of OBJECTS
                                                        "recent_issues", recentIssuesSchema, // 중첩 스키마 OBJECT
                                                        "future_outlook", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.STRING).build()).build(), // ARRAY of String
                                                        
                                                        // ideal_talent: ARRAY of ARRAY of String (가장 복잡한 구조 해결)
                                                        "ideal_talent", Schema.builder()
                                                                .type(Type.Known.ARRAY)
                                                                .items(Schema.builder() // 첫 번째 items: ARRAY (인재상 목록 또는 URL)
                                                                        .type(Type.Known.ARRAY) 
                                                                        .items(Schema.builder().type(Type.Known.STRING).build()) // 두 번째 items: String (인재상 항목)
                                                                        .build())
                                                                .build()
                                                ))
                                                .build()
                                ))
                                .build(),
                        "position", Schema.builder()
                                .type(Type.Known.OBJECT)
                                .properties(Map.of(
                                        "title", Schema.builder().type(Type.Known.STRING).build(),
                                        "summary", positionSummarySchema // 중첩 스키마
                                ))
                                .build(),
                        "transform", Schema.builder()
                                .type(Type.Known.OBJECT)
                                .properties(Map.of(
                                        "notion", Schema.builder()
                                                .type(Type.Known.OBJECT)
                                                .properties(Map.of(
                                                        "title", Schema.builder().type(Type.Known.STRING).build(),
                                                        "sections", Schema.builder()
                                                                .type(Type.Known.ARRAY)
                                                                .items(sectionSchema) // 중첩 스키마
                                                                .build()
                                                ))
                                                .build()
                                ))
                                .build(),
                        "metadata", Schema.builder()
                                .type(Type.Known.OBJECT)
                                .properties(Map.of(
                                        "generated_at", Schema.builder().type(Type.Known.STRING).build(),
                                        "analysis_depth", Schema.builder().type(Type.Known.STRING).build(),
                                        "total_sources", Schema.builder().type(Type.Known.NUMBER).build()
                                ))
                                .build()
                ))
                .build();
    }
}