package com._Blog.app.subscription.service;

import org.springframework.stereotype.Component;

import com._Blog.app.exception.BlogExceptions.BadRequestException;
import com._Blog.app.exception.BlogExceptions.ForbiddenException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.subscription.dto.SubscriptionResponse;
import com._Blog.app.subscription.entity.Subscription;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Component
public class SubscriptionUtils {

    private final UserRepository userRepository;
    private final SecurityContext securityContext;

    public SubscriptionUtils(UserRepository userRepository, SecurityContext securityContext) {
        this.userRepository = userRepository;
        this.securityContext = securityContext;
    }

    // Load the user in the URL or 404.
    public User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    // Load the logged-in user from JWT.
    public User findCurrentUser() {
        Long userId = securityContext.getId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    // A user cannot follow themselves.
    public void rejectSelfFollow(Long subscriberId, Long targetId) {
        if (subscriberId.equals(targetId)) {
            throw new BadRequestException("You cannot follow yourself.");
        }
    }

    // Owner of the follow or admin only.
    public void checkPermission(Subscription subscription) {
        if (!subscription.getSubscriber().getId().equals(securityContext.getId()) && !securityContext.isAdmin()) {
            throw new ForbiddenException("You are not allowed to remove this follow.");
        }
    }

    // DTO: public fields only — no User entity, no password hash.
    public SubscriptionResponse toResponse(Subscription subscription) {
        User subscriber = subscription.getSubscriber();
        User target = subscription.getTarget();
        SubscriptionResponse response = new SubscriptionResponse();
        response.setId(subscription.getId());
        response.setCreatedAt(subscription.getCreatedAt());
        response.setSubscriber(
                new AuthorResponse(subscriber.getId(), subscriber.getUsername(), subscriber.getAvatarUrl()));
        response.setTarget(new AuthorResponse(target.getId(), target.getUsername(), target.getAvatarUrl()));
        return response;
    }
}
