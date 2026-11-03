package com._Blog.app.like.dto;

import java.time.LocalDateTime;

import com._Blog.app.post.dto.AuthorResponse;

public class LikeResponse {
    private Long id;
    private Long postId;
    private LocalDateTime createdAt;
    private AuthorResponse user;

    public LikeResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public AuthorResponse getUser() {
        return user;
    }

    public void setUser(AuthorResponse user) {
        this.user = user;
    }
}
