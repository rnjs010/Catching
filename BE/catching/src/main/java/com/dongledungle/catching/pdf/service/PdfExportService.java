package com.dongledungle.catching.pdf.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.xhtmlrenderer.pdf.ITextRenderer;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfExportService {

    private final TemplateEngine templateEngine;
    private final Gson gson = new Gson();
    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    public byte[] exportAnalysisToPdf(String templateName, Map<String, Object> data) throws Exception {
        if (data.containsKey("content") && data.get("content") != null) {
            String rawJson = (String) data.get("content");
            if (!rawJson.trim().isEmpty()) {
                try {
                    JsonObject jsonObject = gson.fromJson(rawJson, JsonObject.class);

                    if (jsonObject.has("format") && "markdown".equals(jsonObject.get("format").getAsString())) {
                        String markdown = jsonObject.get("content").getAsString();
                        data.put("contentHtml", convertMarkdownToHtml(markdown));
                    } else {
                        data.put("contentHtml", convertMarkdownToHtml(rawJson));
                    }
                } catch (Exception e) {
                    log.warn("JSON 파싱 실패, 원본 텍스트를 마크다운으로 처리: {}", e.getMessage());
                    data.put("contentHtml", convertMarkdownToHtml(rawJson));
                }
            } else {
                data.put("contentHtml", "");
            }
        } else {
            data.put("contentHtml", "");
        }

        Context context = new Context();
        context.setVariables(data);
        String renderedHtml = templateEngine.process(templateName, context);

        log.info("Rendered HTML preview: {}", renderedHtml.length() > 200 ? renderedHtml.substring(0, 200) : renderedHtml);
        return generatePdfFromHtml(renderedHtml);
    }

    public String convertMarkdownToHtml(String markdown) {
        if (markdown == null) return "";

        String processed = markdown;

        // ============================================
        // 날짜 라인 처리 (div로 감싸서 스타일링)
        // 예: 날짜: 2025-10-30 -> <div class="date-line">날짜: 2025-10-30</div>
        // ============================================
        processed = processed.replaceAll(
                "날짜:\\s*([^\\s\\n][^\\n]*)",
                "<div class=\"date-line\">날짜: $1</div>"
        );

        // ============================================
        // [[내부대괄호포함제목]]: URL 패턴
        // 예: [[현대자동차] [계약직] CS강사]: https://...
        // ============================================
        Pattern doubleBracketRefPattern = Pattern.compile(
                "\\[\\[((?:[^\\[\\]]|\\[[^\\]]*\\])*)\\]\\]:\\s*(https?://\\S+)"
        );
        Matcher m2 = doubleBracketRefPattern.matcher(processed);
        StringBuffer sb1 = new StringBuffer();
        while (m2.find()) {
            String title = m2.group(1);
            String url = m2.group(2);
            String replacement = "<div class=\"link-line\">\n<a href='" + Matcher.quoteReplacement(url) + "'>" + Matcher.quoteReplacement(title) + "</a>\n" + "</div>";
            m2.appendReplacement(sb1, replacement);
        }
        m2.appendTail(sb1);
        processed = sb1.toString();

        // ============================================
        // [제목 [중간대괄호] 제목]: URL 패턴
        // 예: [정의선 발언 [이런국장 저런주식]]: https://...
        // 예: [\[현대자동차\] \[계약직\] CS강사 채용]: https://...
        // ============================================
        Pattern bracketInTitleRefPattern = Pattern.compile(
                "\\[((?:[^\\[\\]]|\\[[^\\]]*\\]|\\\\\\[|\\\\\\])+)\\]:\\s*(https?://\\S+)"
        );
        Matcher m3 = bracketInTitleRefPattern.matcher(processed);
        StringBuffer sb2 = new StringBuffer();
        while (m3.find()) {
            String title = m3.group(1);
            String url = m3.group(2);
            String replacement = "<div class=\"link-line\">\n<a href='" + Matcher.quoteReplacement(url) + "'>" + Matcher.quoteReplacement(title) + "</a>\n" + "</div>";
            m3.appendReplacement(sb2, replacement);
        }
        m3.appendTail(sb2);
        processed = sb2.toString();

        // ============================================
        // [태그] 제목: URL 패턴
        // 예: [현대자동차] CS강사 계약직 채용: https://...
        // 예: [TNC공지] 현대자동차 CS강사 역량 향상 과정 진행: https://...
        // ============================================
        Pattern tagTitleUrlPattern = Pattern.compile(
                "(?<!\">)(\\[[^\\]]+\\])\\s+([^:\\[\\]\\n]+):\\s*(https?://\\S+)"
        );
        Matcher m4 = tagTitleUrlPattern.matcher(processed);
        StringBuffer sb3 = new StringBuffer();
        while (m4.find()) {
            String tag = m4.group(1);       // [현대자동차]
            String title = m4.group(2).trim();  // CS강사 계약직 채용
            String url = m4.group(3);
            String fullTitle = tag + " " + title;
            String replacement = "<div class=\"link-line\">\n<a href='" + Matcher.quoteReplacement(url) + "'>" + Matcher.quoteReplacement(fullTitle) + "</a>\n" + "</div>";
            m4.appendReplacement(sb3, replacement);
        }
        m4.appendTail(sb3);
        processed = sb3.toString();

        // ============================================
        // [일반제목]: URL 패턴
        // ============================================
        Pattern simpleRefPattern = Pattern.compile(
                "(?<!\">)\\[([^\\]\\[]+)\\]:\\s*(https?://\\S+)"
        );
        Matcher m6 = simpleRefPattern.matcher(processed);
        StringBuffer sb4 = new StringBuffer();
        while (m6.find()) {
            String title = m6.group(1);
            String url = m6.group(2);
            String replacement = "<div class=\"link-line\">\n<a href='" + Matcher.quoteReplacement(url) + "'>" + Matcher.quoteReplacement(title) + "</a>\n" + "</div>";
            m6.appendReplacement(sb4, replacement);
        }
        m6.appendTail(sb4);
        processed = sb4.toString();

        // ============================================
        // [일반제목](URL) 패턴
        // ============================================
        Pattern simpleLinkPattern = Pattern.compile(
                "(?<!\">)\\[([^\\]]+)\\]\\((https?://[^)]+)\\)"
        );
        Matcher m5 = simpleLinkPattern.matcher(processed);
        StringBuffer sb5 = new StringBuffer();
        while (m5.find()) {
            String title = m5.group(1);
            String url = m5.group(2);
            String replacement = "<div class=\"link-line\">\n<a href='" + Matcher.quoteReplacement(url) + "'>" + Matcher.quoteReplacement(title) + "</a>\n" + "</div>";
            m5.appendReplacement(sb5, replacement);
        }
        m5.appendTail(sb5);
        processed = sb5.toString();

        // 연속 줄바꿈 정리 (3개 이상 -> 2개로)
        processed = processed.replaceAll("\n{3,}", "\n\n");

        // 마크다운 -> HTML 변환
        Node document = markdownParser.parse(processed);
        String html = htmlRenderer.render(document);

        // XHTML 정제 (Flying Saucer 호환)
        return cleanForXhtml(html);
    }

    /**
     * HTML을 XHTML 호환 형태로 정제
     */
    private String cleanForXhtml(String html) {
        // 가장 먼저: 단독 &를 &amp;로 변환 (이미 엔티티인 &xxx; 또는 &#xxx;는 제외)
        html = html.replaceAll("&(?!(#[0-9]+;|#x[0-9a-fA-F]+;|[a-zA-Z]+;))", "&amp;");

        return html
                .replace("<br>", "<br />")
                .replace("<hr>", "<hr />")
                .replaceAll("<img([^>]*)(?<!/)>", "<img$1 />")
                .replace("&nbsp;", "&#160;")
                .replace("&middot;", "&#183;")
                .replace("&bull;", "&#8226;")
                .replace("&ndash;", "&#8211;")
                .replace("&mdash;", "&#8212;")
                .replace("&lsquo;", "&#8216;")
                .replace("&rsquo;", "&#8217;")
                .replace("&ldquo;", "&#8220;")
                .replace("&rdquo;", "&#8221;")
                .replace("&hellip;", "&#8230;")
                .replace("&amp;", "&#38;")
                .replace("&lt;", "&#60;")
                .replace("&gt;", "&#62;");
    }

    private byte[] generatePdfFromHtml(String html) throws Exception {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = iTextRendererWithFonts();

            String cleanedHtml = html.trim();

            int firstOpenTag = cleanedHtml.indexOf("<");
            if (firstOpenTag > 0) {
                cleanedHtml = cleanedHtml.substring(firstOpenTag);
            }

            renderer.setDocumentFromString(cleanedHtml);
            renderer.layout();
            renderer.createPDF(outputStream);

            return outputStream.toByteArray();
        }
    }

    private ITextRenderer iTextRendererWithFonts() throws Exception {
        ITextRenderer renderer = new ITextRenderer();

        String fontPath = new ClassPathResource("fonts/").getURL().toString();

        renderer.getFontResolver().addFont(fontPath + "Pretendard-Regular.ttf", "Pretendard", "Identity-H", true, null);
        renderer.getFontResolver().addFont(fontPath + "Pretendard-Bold.ttf", "Pretendard", "Identity-H", true, null);
        renderer.getFontResolver().addFont(fontPath + "Pretendard-SemiBold.ttf", "Pretendard", "Identity-H", true, null);
        renderer.getFontResolver().addFont(fontPath + "Pretendard-Medium.ttf", "Pretendard", "Identity-H", true, null);

        return renderer;
    }
}