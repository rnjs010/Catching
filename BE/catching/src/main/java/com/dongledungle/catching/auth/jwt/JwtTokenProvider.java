package com.dongledungle.catching.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 토큰 생성 및 검증을 담당하는 Provider
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpireTime;
    private final long refreshTokenExpireTime;

    /**
     * 생성자 - application.yml의 JWT 설정값 주입
     */
    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expire-time}") long accessTokenExpireTime,
            @Value("${jwt.refresh-token-expire-time}") long refreshTokenExpireTime) {

        // 문자열 시크릿으로 HMAC 키 생성
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpireTime = accessTokenExpireTime;
        this.refreshTokenExpireTime = refreshTokenExpireTime;
    }

    /**
     * Access Token 생성
     */
    public String createAccessToken(String userId) {
        Date now = new Date();
        Date expireDate = new Date(now.getTime() + accessTokenExpireTime);

        return Jwts.builder()
                .subject(userId)          // setSubject(userId)와 동일
                .issuedAt(now)            // setIssuedAt(now)
                .expiration(expireDate)   // setExpiration(expireDate)
                .signWith(secretKey)      // HS256 HMAC 키
                .compact();
    }

    /**
     * Refresh Token 생성
     */
    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date expireDate = new Date(now.getTime() + refreshTokenExpireTime);

        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(expireDate)
                .signWith(secretKey)
                .compact();
    }

    /**
     * 토큰에서 사용자 ID 추출
     */
    public String getUserIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()          // ⚠️ parserBuilder() 아님
                    .verifyWith(secretKey)         // 서명 키 설정
                    .build()                       // JwtParser 생성
                    .parseSignedClaims(token)      // 서명된 JWT 파싱
                    .getPayload();                 // Claims(payload) 반환

            return claims.getSubject();
        } catch (JwtException e) {
            log.error("토큰에서 사용자 ID 추출 실패", e);
            throw new RuntimeException("유효하지 않은 토큰입니다.");
        }
    }

    /**
     * 토큰 유효성 검증
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token); // 예전 parseClaimsJws(token) 역할
            return true;

        } catch (ExpiredJwtException e) {
            log.error("만료된 토큰입니다.", e);
        } catch (UnsupportedJwtException e) {
            log.error("지원하지 않는 토큰입니다.", e);
        } catch (MalformedJwtException e) {
            log.error("잘못된 형식의 토큰입니다.", e);
        } catch (SignatureException e) {
            log.error("서명이 유효하지 않은 토큰입니다.", e);
        } catch (IllegalArgumentException e) {
            log.error("토큰이 비어있습니다.", e);
        } catch (JwtException e) {
            log.error("토큰 검증 중 오류", e);
        }

        return false;
    }

    /**
     * 토큰 만료 시간 확인
     */
    public Date getExpirationDateFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.getExpiration();
        } catch (JwtException e) {
            log.error("토큰 만료 시간 확인 실패", e);
            throw new RuntimeException("유효하지 않은 토큰입니다.");
        }
    }
}
