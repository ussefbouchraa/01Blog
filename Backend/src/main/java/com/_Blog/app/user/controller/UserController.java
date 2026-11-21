package com._Blog.app.user.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.post.dto.PostResponse;
import com._Blog.app.user.dto.OwnUserProfileResponse;
import com._Blog.app.user.dto.UpdateUserRequest;
import com._Blog.app.user.dto.UserResponse;
import com._Blog.app.user.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    // GET /api/users/me — returns the authenticated user's own profile (includes email).
    // Must be declared BEFORE /{id} so Spring does not treat "me" as an id.
    @GetMapping("/me")
    public OwnUserProfileResponse getOwnProfile() {
        return userService.getOwnProfile();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @GetMapping("/{id}/posts")
    public List<PostResponse> getUserPosts(@PathVariable Long id) {
        return userService.getUserPosts(id);
    }

    // PUT /api/users/{id} — update user profile (owner or admin only).
    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }
}
