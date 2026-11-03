package com._Blog.app.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com._Blog.app.exception.BlogExceptions.UnauthorizedException;

@Component
public class SecurityContext {

    public Long getId() {
        Authentication authentication = requireAuthentication();
        Object credentials = authentication.getCredentials();
        if (!(credentials instanceof Long userId)) {
            throw new UnauthorizedException("Not authenticated.");
        }
        return userId;
    }

    public boolean isAdmin() {
        return requireAuthentication().getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    private Authentication requireAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Not authenticated.");
        }
        return authentication;
    }
}
