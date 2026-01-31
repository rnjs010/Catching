package com.dongledungle.catching.notion.service;

import com.dongledungle.catching.notion.client.NotionApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.Base64;


import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Notion OAuth code -> token 교환 서비스
 */
@Service
@RequiredArgsConstructor
public class NotionOAuthService {

    private final NotionApiClient notionApiClient;

    @Value("${notion.client-id}")
    private String clientId;

    @Value("${notion.client-secret}")
    private String clientSecret;

    @Value("${notion.redirect-uri}")
    private String redirectUri;

    @Value("${notion.version}")
    private String notionVersion;

    public Map<String, Object> exchangeCode(String code) {
        // Basic Auth: base64(clientId:clientSecret)
        String raw = clientId + ":" + clientSecret;
        String basic = "Basic " + Base64.getEncoder()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));


        Map<String, Object> body = Map.of(
                "grant_type", "authorization_code",
                "code", code,
                "redirect_uri", redirectUri
        );

        return notionApiClient.exchangeToken(basic, body);
    }
}
