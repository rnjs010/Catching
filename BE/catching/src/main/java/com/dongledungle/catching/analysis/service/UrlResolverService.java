package com.dongledungle.catching.analysis.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class UrlResolverService  {
    private static final String VERTEX_REDIRECT_PREFIX = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/";

    // URL 패턴: 마크다운 링크 또는 단독 URL
    private static final Pattern URL_PATTERN = Pattern.compile(
            "(https://vertexaisearch\\.cloud\\.google\\.com/grounding-api-redirect/[^\\s)\\]]+)"
    );

    /**
     * Vertex AI 리다이렉트 URL을 원본 URL로 변환
     * 리다이렉트 URL이 아니면 원본 그대로 반환
     */
    public String resolveUrl(String url) {
        if (url == null || !url.startsWith(VERTEX_REDIRECT_PREFIX)) {
            return url;
        }

        try {
            HttpURLConnection connection = (HttpURLConnection) URI.create(url).toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setInstanceFollowRedirects(false);  // 자동 리다이렉트 비활성화
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            int responseCode = connection.getResponseCode();

            if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||    // 302
                    responseCode == HttpURLConnection.HTTP_MOVED_PERM ||    // 301
                    responseCode == HttpURLConnection.HTTP_SEE_OTHER) {     // 303

                // 먼저 헤더에서 추출 시도
                String location = connection.getHeaderField("Location");
                if (location != null && !location.isEmpty()) {
                    log.debug("URL resolved: {} -> {}", url, location);
                    return location;
                }

                // 실패했을 경우 받은 HTML 본문 파싱
                try (BufferedReader in = new BufferedReader(
                        new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {

                    String line;
                    // 대소문자 구분 없이 <a href="...">를 찾는 정규식
                    Pattern linkPattern = Pattern.compile("(?i)<a\\s+href=\"([^\"]+)\"");

                    while ((line = in.readLine()) != null) {
                        Matcher linkMatcher = linkPattern.matcher(line);
                        if (linkMatcher.find()) {
                            String extractedUrl = linkMatcher.group(1);
                            log.debug("URL resolved via HTML Body: {} -> {}", url, extractedUrl);
                            return extractedUrl;
                        }
                    }
                }
            }

            connection.disconnect();
        } catch (Exception e) {
            log.warn("URL 변환 실패, 원본 유지: {} - {}", url, e.getMessage());
        }

        return url;  // 실패 시 원본 반환
    }

    /**
     * 텍스트 내 모든 Vertex 리다이렉트 URL을 원본으로 변환
     */
    public String replaceAllRedirectUrls(String content) {
        if (content == null || !content.contains(VERTEX_REDIRECT_PREFIX)) {
            return content;
        }

        Matcher matcher = URL_PATTERN.matcher(content);
        StringBuffer result = new StringBuffer();

        while (matcher.find()) {
            String originalUrl = matcher.group(1);
            String resolvedUrl = resolveUrl(originalUrl);
            matcher.appendReplacement(result, Matcher.quoteReplacement(resolvedUrl));
        }
        matcher.appendTail(result);

        return result.toString();
    }
}
