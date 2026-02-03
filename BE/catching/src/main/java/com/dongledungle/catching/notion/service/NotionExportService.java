package com.dongledungle.catching.notion.service;

import com.dongledungle.catching.analysis.entity.Analysis;
import com.dongledungle.catching.analysis.repository.AnalysisRepository;
import com.dongledungle.catching.auth.entity.User;
import com.dongledungle.catching.auth.repository.UserRepository;
import com.dongledungle.catching.notion.client.NotionApiClient;
import com.dongledungle.catching.notion.dto.response.ExportResponse;
import com.dongledungle.catching.notion.entity.Notion;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotionExportService {

    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;
    private final NotionApiClient notionApiClient;
    private final Gson gson = new Gson();

    public ExportResponse exportAnalysis(Long userId, Long analysisId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Notion notion = user.getNotion();
        if (notion == null || notion.getNotionAccessToken() == null) {
            throw new IllegalStateException("Notion 연동이 필요합니다.");
        }

        if (notion.getNotionDefaultPageId() == null || notion.getNotionDefaultPageId().isEmpty()) {
            throw new IllegalStateException("기본 저장 페이지를 먼저 설정해주세요.");
        }

        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new IllegalArgumentException("분석 정보를 찾을 수 없습니다."));

        // JSON 파싱
        JsonObject jsonObject = gson.fromJson(analysis.getContent(), JsonObject.class);
        String markdownContent = jsonObject.get("content").getAsString();

        // Notion 블록 생성
        List<Map<String, Object>> blocks = parseMarkdownToBlocks(markdownContent);

        // Notion API 호출
        String title = analysis.getCompany() + " - " + analysis.getPosition();
        return createNotionPage(notion.getNotionAccessToken(), notion.getNotionDefaultPageId(), title, blocks);
    }

    private List<Map<String, Object>> parseMarkdownToBlocks(String markdown) {
        List<Map<String, Object>> blocks = new ArrayList<>();
        String[] lines = markdown.split("\n");

        Map<String, Object> lastListItem = null;

        for (String line : lines) {
            line = line.trim();

            if (line.isEmpty()) {
                lastListItem = null;
                continue;
            }

            if (line.startsWith("### ")) {
                lastListItem = null;
                blocks.add(createHeadingBlock(3, line.substring(4)));
            } else if (line.startsWith("## ")) {
                lastListItem = null;
                blocks.add(createHeadingBlock(2, line.substring(3)));
            } else if (line.startsWith("# ")) {
                lastListItem = null;
                blocks.add(createHeadingBlock(1, line.substring(2)));
            } else if (line.startsWith("- ")) {
                Map<String, Object> listItem = createBulletedListItemBlock(line.substring(2));
                blocks.add(listItem);
                lastListItem = listItem;
            } else {
                // 리스트 바로 다음 줄이면서 들여쓰기가 있거나 마커가 없는 경우 하위 요소로 처리
                if (lastListItem != null) {
                    addChildToBlock(lastListItem, createParagraphBlock(line));
                } else {
                    blocks.add(createParagraphBlock(line));
                }
            }
        }
        return blocks;
    }

    private void addChildToBlock(Map<String, Object> parent, Map<String, Object> child) {
        String type = (String) parent.get("type");
        Map<String, Object> content = (Map<String, Object>) parent.get(type);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> children = (List<Map<String, Object>>) content.get("children");
        if (children == null) {
            children = new ArrayList<>();
            content.put("children", children);
        }
        children.add(child);
    }

    private Map<String, Object> createHeadingBlock(int level, String text) {
        String type = "heading_" + level;
        Map<String, Object> block = new HashMap<>();
        block.put("object", "block");
        block.put("type", type);

        Map<String, Object> content = new HashMap<>();
        content.put("rich_text", parseRichText(text));
        block.put(type, content);

        return block;
    }

    private Map<String, Object> createBulletedListItemBlock(String text) {
        Map<String, Object> block = new HashMap<>();
        block.put("object", "block");
        block.put("type", "bulleted_list_item");

        Map<String, Object> content = new HashMap<>();
        content.put("rich_text", parseRichText(text));
        block.put("bulleted_list_item", content);

        return block;
    }

    private Map<String, Object> createParagraphBlock(String text) {
        Map<String, Object> block = new HashMap<>();
        block.put("object", "block");
        block.put("type", "paragraph");

        Map<String, Object> content = new HashMap<>();
        content.put("rich_text", parseRichText(text));
        block.put("paragraph", content);

        return block;
    }

    private List<Map<String, Object>> parseRichText(String text) {
        List<Map<String, Object>> richText = new ArrayList<>();

        // 1. 표준 마크다운 링크: [제목](URL)
        // 2. 콜론 기반 링크: [라벨] 제목: URL 또는 제목: URL
        // 통합 패턴: (\[(.*?)\]\((https?://\S+?)\))|((?:\[.*?\])?.*?):\s*(https?://\S+)
        Pattern linkPattern = Pattern.compile("(\\[(.*?)\\]\\((https?://\\S+?)\\))|((?:\\[.*?\\])?.*?):\\s*(https?://\\S+)");
        Matcher linkMatcher = linkPattern.matcher(text);

        int lastEnd = 0;
        while (linkMatcher.find()) {
            // 링크 이전 텍스트 처리
            if (linkMatcher.start() > lastEnd) {
                addTextWithBold(richText, text.substring(lastEnd, linkMatcher.start()));
            }

            String title;
            String url;

            if (linkMatcher.group(1) != null) {
                // 케이스 1: [제목](URL)
                title = linkMatcher.group(2);
                url = linkMatcher.group(3);
            } else {
                // 케이스 2: [라벨] 제목: URL 또는 제목: URL
                title = linkMatcher.group(4).trim();
                url = linkMatcher.group(5);
            }

            richText.add(Map.of(
                    "type", "text",
                    "text", Map.of(
                            "content", title,
                            "link", Map.of("url", url)
                    )
            ));
            lastEnd = linkMatcher.end();
        }

        // 남은 텍스트 처리
        if (lastEnd < text.length()) {
            addTextWithBold(richText, text.substring(lastEnd));
        }

        return richText;
    }

    private void addTextWithBold(List<Map<String, Object>> richText, String text) {
        Pattern boldPattern = Pattern.compile("\\*\\*(.*?)\\*\\*");
        Matcher boldMatcher = boldPattern.matcher(text);

        int lastEnd = 0;
        while (boldMatcher.find()) {
            if (boldMatcher.start() > lastEnd) {
                richText.add(createTextPart(text.substring(lastEnd, boldMatcher.start()), false));
            }
            richText.add(createTextPart(boldMatcher.group(1), true));
            lastEnd = boldMatcher.end();
        }

        if (lastEnd < text.length()) {
            richText.add(createTextPart(text.substring(lastEnd), false));
        }
    }

    private Map<String, Object> createTextPart(String content, boolean isBold) {
        return Map.of(
                "type", "text",
                "text", Map.of("content", content),
                "annotations", Map.of("bold", isBold)
        );
    }

    private ExportResponse createNotionPage(String accessToken, String parentPageId, String title, List<Map<String, Object>> blocks) {
        // 1. 블록 100개씩 분할 (Notion API 제한 대응)
        int batchSize = 100;
        List<List<Map<String, Object>>> partitions = new ArrayList<>();
        for (int i = 0; i < blocks.size(); i += batchSize) {
            partitions.add(blocks.subList(i, Math.min(i + batchSize, blocks.size())));
        }

        // 2. 첫 100개로 페이지 생성
        List<Map<String, Object>> firstBatch = partitions.isEmpty() ? new ArrayList<>() : partitions.get(0);
        
        Map<String, Object> body = new HashMap<>();
        body.put("parent", Map.of("page_id", parentPageId));
        body.put("properties", Map.of(
                "title", Map.of(
                        "title", List.of(Map.of(
                                "text", Map.of("content", title)
                        ))
                )
        ));
        
        if (!firstBatch.isEmpty()) {
            body.put("children", firstBatch);
        }

        Map result = notionApiClient.createPage(accessToken, body);
        String pageId = (String) result.get("id");
        String url = (String) result.get("url");

        // 3. 나머지 블록이 있다면 Append (PATCH /blocks/{id}/children)
        for (int i = 1; i < partitions.size(); i++) {
            List<Map<String, Object>> nextBatch = partitions.get(i);
            Map<String, Object> appendBody = Map.of("children", nextBatch);
            notionApiClient.appendChildren(accessToken, pageId, appendBody);
            log.info("Batch {} ({} blocks) appended to page {}", i + 1, nextBatch.size(), pageId);
        }

        return new ExportResponse(url, pageId);
    }
}
