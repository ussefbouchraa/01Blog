package com._Blog.app.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import com._Blog.app.user.entity.User;

@Component
public class JwtUtil {

    // Pulls the value dynamically from application.properties!
    @Value("${jwt.secret}")
    
    private String secretString;

    private SecretKey key;

    // 1 Day in milliseconds
    private static final long EXPIRATION_TIME = 86400000;

    // This runs automatically right after Spring creates this Bean,
    // converting the string into the cryptographic key securely.
    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
    }

    // 1. GENERATE TOKEN (Called when user logs in successfully)
    public String generateToken(User user) {
        return Jwts.builder()
                .claim("id", user.getId())
                .subject(user.getUsername())
                .claim("role", user.getRole())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    // 2. EXTRACT USERNAME (Called to figure out WHO is making a protected request)
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Object userId = parseClaims(token).get("id");
        return userId instanceof Number ? ((Number) userId).longValue() : null;
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    // 3. VALIDATE TOKEN (Called to check if token is fake or expired)
    public boolean isTokenValid(String token) {
        return extractUserId(token) != null
                && extractRole(token) != null
                && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        Date expiration = parseClaims(token)
                .getExpiration();
        return expiration == null || expiration.before(new Date());
    }

    private io.jsonwebtoken.Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
