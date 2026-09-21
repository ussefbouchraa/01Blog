package com._Blog.app.subscription.dto;

import java.time.LocalDateTime;

import com._Blog.app.post.dto.AuthorResponse;

public class SubscriptionResponse {
    private Long id;
    private LocalDateTime createdAt;
    private AuthorResponse subscriber;
    private AuthorResponse target;

    public SubscriptionResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public AuthorResponse getSubscriber() {
        return subscriber;
    }

    public void setSubscriber(AuthorResponse subscriber) {
        this.subscriber = subscriber;
    }

    public AuthorResponse getTarget() {
        return target;
    }

    public void setTarget(AuthorResponse target) {
        this.target = target;
    }
}
