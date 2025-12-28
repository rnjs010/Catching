package com.dongledungle.catching.auth.jwt.filter;

import com.dongledungle.catching.auth.jwt.JwtTokenProvider;
import com.dongledungle.catching.common.response.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractTokenFromRequest(request);

        // 토큰이 없으면 그냥 통과 (permitAll 엔드포인트용)
        if (!StringUtils.hasText(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 토큰 검증
            if (jwtTokenProvider.validateToken(token)) {
                String userId = jwtTokenProvider.getUserIdFromToken(token);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.emptyList()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("사용자 인증 성공: userId={}", userId);
            } else {
                // validateToken이 false 반환 (만료 외 다른 오류)
                sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다.");
                return;
            }

            filterChain.doFilter(request, response);

        } catch (ExpiredJwtException e) {
            log.warn("토큰 만료: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다.");
            return;

        } catch (JwtException e) {
            log.warn("유효하지 않은 토큰: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다.");
            return;

        } catch (Exception e) {
            log.error("JWT 인증 필터 에러", e);
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "인증 처리 중 오류가 발생했습니다.");
            return;
        }
    }

    /**
     * 에러 응답 (공용 ApiResponse 형식)
     */
    private void sendErrorResponse(HttpServletResponse response, HttpStatus httpStatus, String message) throws IOException {
        response.setStatus(httpStatus.value());
        response.setContentType("application/json;charset=UTF-8");

        ApiResponse<Object> body = ApiResponse.error(httpStatus, message);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    /**
     * Request Header에서 Bearer Token 추출
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        return null;
    }
}
