package com.dongledungle.catching.notion.controller;

import com.dongledungle.catching.notion.auth.NotionStateTokenProvider;
import com.dongledungle.catching.notion.dto.response.NotionOauthUrlResponse;
import com.dongledungle.catching.notion.service.NotionIntegrationService;
import com.dongledungle.catching.notion.service.NotionOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Notion OAuth 시작/콜백 컨트롤러
 *
 * - GET /api/notion/oauth
 *   로그인 유저의 userId를 state에 담아 authorize URL 생성
 *
 * - GET /api/notion/callback (permitAll)
 *   Notion이 redirect_uri로 호출 -> code를 token으로 교환 -> DB 저장
 *   success/error html 반환
 */
@Controller
@RequiredArgsConstructor
@RequestMapping("/api/notion")
public class NotionOAuthController {

    private final NotionStateTokenProvider stateTokenProvider;
    private final NotionOAuthService notionOAuthService;
    private final NotionIntegrationService notionIntegrationService;

    /**
     * application.yml에서 주입
     * notion:
     *   client-id:
     *   redirect-uri:
     */
    @Value("${notion.client-id}")
    private String clientId;

    @Value("${notion.redirect-uri}")
    private String redirectUri;

    @GetMapping(value = "/oauth", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public NotionOauthUrlResponse oauth(Authentication authentication) {
        // 프로젝트 표준: principal = userId(String)
        Long userId = Long.parseLong((String) authentication.getPrincipal());

        // 콜백에서 userId 복원하기 위해 state에 서명된 토큰 생성
        String state = stateTokenProvider.generate(userId);

        // Notion OAuth authorize URL 생성
        String url = "https://api.notion.com/v1/oauth/authorize"
                + "?client_id=" + urlEncode(clientId)
                + "&response_type=code"
                + "&owner=user"
                + "&redirect_uri=" + urlEncode(redirectUri)
                + "&state=" + urlEncode(state);

        return new NotionOauthUrlResponse(url);
    }

    /**
     * Notion 콜백
     * - SecurityConfig에서 /api/notion/callback 은 permitAll 필수
     * - 성공/실패 시 static html을 반환(확장프로그램에서 탭 닫기 용도)
     */
    @GetMapping(value = "/callback", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String callback(@RequestParam(required = false) String code,
                           @RequestParam(required = false) String state,
                           @RequestParam(required = false) String error) {

        boolean success = false;

        // Notion에서 error가 내려오면 실패
        if (error == null && code != null && state != null) {
            try {
                // state 검증 후 userId 복원
                Long userId = stateTokenProvider.parseAndValidate(state);

                // code -> token 교환
                Map<String, Object> tokenResponse = notionOAuthService.exchangeCode(code);

                // DB 저장
                notionIntegrationService.saveToken(userId, tokenResponse);

                success = true;
            } catch (Exception e) {
                // 실패 시 success false 유지
                success = false;
            }
        }

        // success/error static html 반환
        return loadHtml(success ? "notion/success.html" : "notion/error.html");
    }

    private String loadHtml(String path) {
        try {
            ClassPathResource resource = new ClassPathResource("static/" + path);
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "<html><body><h3>Notion 연동 처리 중 오류가 발생했습니다.</h3></body></html>";
        }
    }

    private static String urlEncode(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }
}
