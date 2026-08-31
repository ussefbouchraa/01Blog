package com._Blog.app.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

import com._Blog.app.auth.dto.LoginRequest;
import com._Blog.app.auth.dto.RegisterRequest;
import com._Blog.app.exception.ResourceAlreadyExistsException;
import com._Blog.app.exception.UnauthorizedException;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Handles user registration logic
    public String registerUser(RegisterRequest request) {
        // 1. Check if username or email already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ResourceAlreadyExistsException("Username is already taken.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResourceAlreadyExistsException("Email is already taken.");
        }

        // 2. Create the new User entity
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setRole("USER"); // Default role
        newUser.setCreatedAt(LocalDateTime.now());

        // 3. Hash the password BEFORE saving it!
        String hashed = passwordEncoder.encode(request.getPassword());
        newUser.setPasswordHash(hashed);

        // 4. Save to the database
        userRepository.save(newUser);

        return "User registered successfully!";
    }

    // Handles user login logic
    public String loginUser(LoginRequest request) {
        // 1. Find user by username
        Optional<User> optionalUser = userRepository.findByUsername(request.getUsername());

        if (optionalUser.isEmpty()) {
            throw new UnauthorizedException("Invalid username or password.");
        }

        User user = optionalUser.get();

        // 2. Check if the typed password matches the hashed password in the DB
        boolean passwordsMatch = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!passwordsMatch) {
            throw new UnauthorizedException("Invalid username or password.");
        }

        // 3. (Phase 6, Task 4) Here is where we will eventually generate the JWT token.
        // For now, let's just return a success message.
        return "Login successful! (JWT token coming soon)";
    }
}
