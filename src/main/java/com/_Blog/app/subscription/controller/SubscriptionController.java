package com._Blog.app.subscription.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.subscription.dto.SubscriptionResponse;
import com._Blog.app.subscription.service.SubscriptionService;

@RestController
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    // Nested under the user: list who follows them.
    @GetMapping("/api/users/{userId}/followers")
    public List<SubscriptionResponse> getFollowers(@PathVariable Long userId) {
        return subscriptionService.getFollowers(userId);
    }

    // Nested under the user: list who they follow.
    @GetMapping("/api/users/{userId}/following")
    public List<SubscriptionResponse> getFollowing(@PathVariable Long userId) {
        return subscriptionService.getFollowing(userId);
    }

    // Nested under the user: logged-in user follows them (once).
    @PostMapping("/api/users/{userId}/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse follow(@PathVariable Long userId) {
        return subscriptionService.follow(userId);
    }

    // Nested under the user: logged-in user unfollows them.
    @DeleteMapping("/api/users/{userId}/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(@PathVariable Long userId) {
        subscriptionService.unfollow(userId);
    }
}
