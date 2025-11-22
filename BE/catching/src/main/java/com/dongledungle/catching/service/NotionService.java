package com.dongledungle.catching.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NotionService {

    @Value("${notion.api-key}")
    private String notionApiKey;

    @Value("${notion.parent-page-id}")
    private String parentPageId;

    @Value("${notion.version}")
    private String notionVersion;

    private final RestClient restClient;
    private final Gson gson = new Gson();

    private static final Pattern LINK_PATTERN = Pattern.compile("\\[([^\\[\\]]+)\\]\\(([^\\(\\)]+)\\)");

    public NotionService(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("https://api.notion.com/v1").build();
    }

    public String createPageFromAnalysis(String jsonAnalysis) {
        JsonObject analysis = gson.fromJson(jsonAnalysis, JsonObject.class);
        JsonObject notionData = analysis.getAsJsonObject("transform").getAsJsonObject("notion");
        String title = notionData.get("title").getAsString();
        JsonArray sections = notionData.getAsJsonArray("sections");

        // 1. Create Page
        String pageId = createPage(title);

        // 2. Add Blocks
        List<Map<String, Object>> allBlocks = new ArrayList<>();
        
        for (JsonElement secElem : sections) {
            JsonObject sec = secElem.getAsJsonObject();
            
            // H2
            if (sec.has("h2")) {
                allBlocks.add(makeHeadingBlock(2, sec.get("h2").getAsString()));
            }

            if (sec.has("subsections")) {
                JsonArray subsections = sec.getAsJsonArray("subsections");
                for (JsonElement subElem : subsections) {
                    JsonObject sub = subElem.getAsJsonObject();
                    
                    // H3
                    if (sub.has("h3")) {
                        allBlocks.add(makeHeadingBlock(3, sub.get("h3").getAsString()));
                    }
                    
                    // Content
                    if (sub.has("content")) {
                        allBlocks.addAll(processContent(sub.get("content").getAsString()));
                    }
                }
            }
        }

        int batchSize = 100;
        for (int i = 0; i < allBlocks.size(); i += batchSize) {
            int end = Math.min(i + batchSize, allBlocks.size());
            appendBlocks(pageId, allBlocks.subList(i, end));
        }

        return pageId;
    }

    private String createPage(String title) {
        Map<String, Object> body = new HashMap<>();
        Map<String, Object> parent = new HashMap<>();
        parent.put("page_id", parentPageId);
        body.put("parent", parent);

        Map<String, Object> properties = new HashMap<>();
        Map<String, Object> titleProp = new HashMap<>();
        titleProp.put("title", List.of(Map.of("text", Map.of("content", title))));
        properties.put("title", titleProp);
        body.put("properties", properties);

        String response = restClient.post()
                .uri("/pages")
                .header("Authorization", "Bearer " + notionApiKey)
                .header("Notion-Version", notionVersion)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);
        
        JsonObject res = gson.fromJson(response, JsonObject.class);
        return res.get("id").getAsString();
    }

    private void appendBlocks(String pageId, List<Map<String, Object>> blocks) {
        Map<String, Object> body = new HashMap<>();
        body.put("children", blocks);

        restClient.patch()
                .uri("/blocks/" + pageId + "/children")
                .header("Authorization", "Bearer " + notionApiKey)
                .header("Notion-Version", notionVersion)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    private Map<String, Object> makeHeadingBlock(int level, String content) {
        Map<String, Object> block = new HashMap<>();
        block.put("object", "block");
        String type = "heading_" + level;
        block.put("type", type);
        block.put(type, Map.of("rich_text", richtextLinkParser(content)));
        return block;
    }

    private List<Map<String, Object>> processContent(String content) {
        List<Map<String, Object>> blocks = new ArrayList<>();
        String[] lines = content.split("\n");
        int i = 0;
        while (i < lines.length) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                i++;
                continue;
            }

            if (line.startsWith("-")) {
                List<String> bullets = new ArrayList<>();
                while (i < lines.length && lines[i].trim().startsWith("-")) {
                    bullets.add(lines[i].trim().substring(1).trim());
                    i++;
                }
                for (String bullet : bullets) {
                    blocks.add(makeBullet(bullet));
                }
            } else if (line.matches("^\\d+\\..*")) {
                List<String> nums = new ArrayList<>();
                while (i < lines.length && lines[i].trim().matches("^\\d+\\..*")) {
                    nums.add(lines[i].trim().replaceFirst("^\\d+\\.\\s*", ""));
                    i++;
                }
                for (String num : nums) {
                    blocks.add(makeNumbered(num));
                }
            } else {
                List<String> textLines = new ArrayList<>();
                while (i < lines.length && !lines[i].trim().startsWith("-") && !lines[i].trim().matches("^\\d+\\..*") && !lines[i].trim().isEmpty()) {
                    textLines.add(lines[i]);
                    i++;
                }
                if (!textLines.isEmpty()) {
                    blocks.addAll(makeParagraph(String.join("\n", textLines)));
                }
            }
        }
        return blocks;
    }

    private Map<String, Object> makeBullet(String content) {
        Map<String, Object> block = new HashMap<>();
        block.put("object", "block");
        block.put("type", "bulleted_list_item");
        block.put("bulleted_list_item", Map.of("rich_text", richtextParser(content)));
        return block;
    }

    private Map<String, Object> makeNumbered(String content) {
        Map<String, Object> block = new HashMap<>();
        block.put("object", "block");
        block.put("type", "numbered_list_item");
        block.put("numbered_list_item", Map.of("rich_text", richtextParser(content)));
        return block;
    }

    private List<Map<String, Object>> makeParagraph(String content) {
        List<Map<String, Object>> blocks = new ArrayList<>();
        String[] paras = content.split("\n");
        for (String para : paras) {
            if (para.trim().isEmpty()) continue;
            Map<String, Object> block = new HashMap<>();
            block.put("object", "block");
            block.put("type", "paragraph");
            block.put("paragraph", Map.of("rich_text", richtextParser(para)));
            blocks.add(block);
        }
        return blocks;
    }

    private List<Map<String, Object>> richtextParser(String text) {
        List<Map<String, Object>> chunks = new ArrayList<>();
        Pattern pattern = Pattern.compile("\\*\\*([^\\*]+)\\*\\*");
        Matcher matcher = pattern.matcher(text);
        int lastIdx = 0;
        
        while (matcher.find()) {
            if (matcher.start() > lastIdx) {
                chunks.add(createText(text.substring(lastIdx, matcher.start()), false, null));
            }
            chunks.add(createText(matcher.group(1), true, null));
            lastIdx = matcher.end();
        }
        
        if (lastIdx < text.length()) {
            chunks.add(createText(text.substring(lastIdx), false, null));
        }
        
        if (chunks.isEmpty()) {
            chunks.add(createText(text, false, null));
        }
        return chunks;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> richtextLinkParser(String text) {
        List<Map<String, Object>> chunks = new ArrayList<>();
        Matcher linkMatcher = LINK_PATTERN.matcher(text);
        
        int lastIdx = 0;
        
        while (linkMatcher.find()) {
            if (linkMatcher.start() > lastIdx) {
                chunks.addAll(richtextParser(text.substring(lastIdx, linkMatcher.start())));
            }
            
            String linkText = linkMatcher.group(1);
            String url = linkMatcher.group(2);
            List<Map<String, Object>> linkChunks = richtextParser(linkText);
            
            for (Map<String, Object> chunk : linkChunks) {
                Map<String, Object> textMap = (Map<String, Object>) chunk.get("text");
                Map<String, Object> annotations = (Map<String, Object>) chunk.get("annotations");
                
                String content = (String) textMap.get("content");
                Boolean isBold = (Boolean) annotations.get("bold");
                
                chunks.add(createText(content, isBold, url));
            }
            
            lastIdx = linkMatcher.end();
        }
        
        if (lastIdx < text.length()) {
            chunks.addAll(richtextParser(text.substring(lastIdx)));
        }
        
        if (chunks.isEmpty() && text.trim().length() > 0) {
            chunks.add(createText(text, false, null));
        }
        return chunks;
    }

    private Map<String, Object> createText(String content, boolean bold, String url) {
        Map<String, Object> textMap = new HashMap<>();
        textMap.put("type", "text");
        
        Map<String, Object> textContent = new HashMap<>();
        textContent.put("content", content);
        
        if (url != null && !url.isEmpty()) {
            textContent.put("link", Map.of("url", url));
        }
        
        textMap.put("text", textContent);
        textMap.put("annotations", Map.of("bold", bold));

        return textMap;
    }
}
