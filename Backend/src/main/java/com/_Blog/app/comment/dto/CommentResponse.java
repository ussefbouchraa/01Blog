package com._Blog.app.comment.dto;

import java.time.LocalDateTime;

import com._Blog.app.post.dto.AuthorResponse;

public class CommentResponse {
    private Long id;
    private Long postId;
    private String content;
    private LocalDateTime createdAt;
    private AuthorResponse author;

    public CommentResponse() {
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public AuthorResponse getAuthor() {
        return author;
    }

    public void setAuthor(AuthorResponse author) {
        this.author = author;
    }
}
