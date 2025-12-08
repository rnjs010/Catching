package com.dongledungle.catching.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 설정
 * 외부 API 호출을 위한 HTTP 클라이언트 Bean 등록
 */
@Configuration
public class RestTemplateConfig {

    /**
     * RestTemplate Bean 등록
     * GoogleService에서 구글 OAuth2 API 호출 시 사용
     *
     * @return RestTemplate 인스턴스
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}