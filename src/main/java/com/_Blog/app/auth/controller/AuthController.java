package com._Blog.app.auth.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.auth.dto.LoginRequest;
import com._Blog.app.auth.dto.RegisterRequest;
import com._Blog.app.auth.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return authService.registerUser(request);
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return authService.loginUser(request);
    }
}
