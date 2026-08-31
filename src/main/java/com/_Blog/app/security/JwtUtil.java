package com._Blog.app.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

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
    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    // 2. EXTRACT USERNAME (Called to figure out WHO is making a protected request)
    public String extractUsername(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 3. VALIDATE TOKEN (Called to check if token is fake or expired)
    public boolean isTokenValid(String token, String username) {
        String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
        return expiration.before(new Date());
    }
}
