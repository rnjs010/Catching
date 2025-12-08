package com.dongledungle.catching.auth.jwt.filter;

import com.dongledungle.catching.auth.jwt.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT 인증 필터
 * 모든 HTTP 요청에서 JWT 토큰을 검증하고 인증 처리
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    /**
     * HTTP 요청마다 JWT 토큰 검증 및 인증 처리
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Request Header에서 JWT 토큰 추출
            String token = extractTokenFromRequest(request);

            // 2. 토큰 유효성 검증
            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                // 3. 토큰에서 사용자 ID 추출
                String userId = jwtTokenProvider.getUserIdFromToken(token);

                // 4. Spring Security 인증 객체 생성
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.emptyList()  // 권한 목록 (필요시 추가)
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 5. SecurityContext에 인증 정보 저장
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("사용자 인증 성공: userId={}", userId);
            }
        } catch (Exception e) {
            log.error("JWT 인증 필터 에러", e);
        }

        // 6. 다음 필터로 진행
        filterChain.doFilter(request, response);
    }

    /**
     * Request Header에서 Bearer Token 추출
     * @param request HTTP 요청
     * @return JWT 토큰 (Bearer 제거)
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        // "Bearer {token}" 형식에서 토큰만 추출
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
}