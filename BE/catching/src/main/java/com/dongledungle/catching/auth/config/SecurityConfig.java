package com.dongledungle.catching.auth.config;

import com.dongledungle.catching.auth.jwt.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Spring Security 설정
 * JWT 기반 인증 및 CORS 설정
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Security Filter Chain 설정
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CSRF 비활성화 (JWT 사용 시 불필요)
                .csrf(csrf -> csrf.disable())

                // CORS 설정 활성화
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 세션 사용 안 함 (Stateless)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 인증 규칙 설정
                .authorizeHttpRequests(auth -> auth
                        // 인증 없이 접근 가능한 경로
                        .requestMatchers("/api/auth/login").permitAll()  // 로그인
                        .requestMatchers("/api/auth/refresh").permitAll() // 토큰 갱신
                        .requestMatchers("/actuator/health").permitAll()  // 헬스췤
                        .requestMatchers("/api/notion/callback").permitAll()
                        .requestMatchers("/notion/**").permitAll()

                        // 나머지는 인증 필요
                        .anyRequest().authenticated()
                )

                // JWT 인증 필터 추가 (UsernamePasswordAuthenticationFilter 이전에 실행)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS 설정
     * 크롬 익스텐션에서의 요청을 허용
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 허용할 출처 (크롬 익스텐션 포함)
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));

        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // 허용할 헤더
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // 인증 정보 포함 여부
        configuration.setAllowCredentials(true);

        // 응답 헤더 노출
        configuration.setExposedHeaders(Arrays.asList("Authorization"));

        // 설정 등록
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}