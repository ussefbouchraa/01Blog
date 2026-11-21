package com._Blog.app.user.dto;

// DTO for updating a user's own profile via PUT /api/users/{id}.
// Only the fields present (non-null) will be applied.
// Role and passwordHash are never accepted here.
public class UpdateUserRequest {
    private String username;
    private String email;
    private String bio;
    private String avatarUrl;

    public UpdateUserRequest() {
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
