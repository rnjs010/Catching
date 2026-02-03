package com.dongledungle.catching.notion.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Notion OAuth state 토큰 생성/검증
 */
@Component
public class NotionStateTokenProvider {

    private final SecretKey key;

    // state는 짧게 만료(권장: 10분)
    private static final long EXPIRATION_MILLIS = 10 * 60 * 1000L;

    public NotionStateTokenProvider(@Value("${jwt.secret}") String secret) {
        // HS256용 키 생성 (secret은 충분히 길게: 최소 32바이트 권장)
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** userId를 subject에 담아 state 토큰 생성 */
    public String generate(Long userId) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + EXPIRATION_MILLIS);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(exp)
                // ✅ 0.12.x: signWith(SecretKey, Jwts.SIG.HS256) 형태 권장
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** state 토큰 검증 후 userId 반환 */
    public Long parseAndValidate(String state) {
        try {
            // ✅ 0.12.x: parser() -> verifyWith(key) -> build()
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    // ✅ 서명된 토큰 파싱 (Signed Claims)
                    .parseSignedClaims(state)
                    .getPayload();

            return Long.parseLong(claims.getSubject());
        } catch (ExpiredJwtException e) {
            throw new IllegalStateException("Notion 연동 요청이 만료되었습니다. 다시 시도해주세요.");
        } catch (Exception e) {
            throw new IllegalStateException("유효하지 않은 Notion 연동 요청입니다.");
        }
    }
}
