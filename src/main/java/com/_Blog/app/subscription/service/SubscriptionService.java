package com._Blog.app.subscription.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com._Blog.app.exception.BlogExceptions.ResourceAlreadyExistsException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.notification.service.NotificationUtils;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.subscription.dto.SubscriptionResponse;
import com._Blog.app.subscription.entity.Subscription;
import com._Blog.app.subscription.repository.SubscriptionRepository;
import com._Blog.app.user.entity.User;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SecurityContext securityContext;
    private final SubscriptionUtils subscriptionUtils;
    private final NotificationUtils notificationUtils;

    public SubscriptionService(SubscriptionRepository subscriptionRepository, SecurityContext securityContext,
            SubscriptionUtils subscriptionUtils, NotificationUtils notificationUtils) {
        this.subscriptionRepository = subscriptionRepository;
        this.securityContext = securityContext;
        this.subscriptionUtils = subscriptionUtils;
        this.notificationUtils = notificationUtils;
    }

    // List: who follows this user, oldest first.
    public List<SubscriptionResponse> getFollowers(Long userId) {
        subscriptionUtils.findUser(userId);
        return subscriptionRepository.findByTargetIdOrderByCreatedAtAsc(userId).stream()
                .map(subscriptionUtils::toResponse).toList();
    }

    // List: who this user follows, oldest first.
    public List<SubscriptionResponse> getFollowing(Long userId) {
        subscriptionUtils.findUser(userId);
        return subscriptionRepository.findBySubscriberIdOrderByCreatedAtAsc(userId).stream()
                .map(subscriptionUtils::toResponse).toList();
    }

    // Create: one follow per pair (JWT user + target in the URL).
    public SubscriptionResponse follow(Long targetId) {
        User subscriber = subscriptionUtils.findCurrentUser();
        User target = subscriptionUtils.findUser(targetId);
        subscriptionUtils.rejectSelfFollow(subscriber.getId(), target.getId());

        if (subscriptionRepository.existsBySubscriberIdAndTargetId(subscriber.getId(), target.getId())) {
            throw new ResourceAlreadyExistsException("You already follow this user.");
        }

        Subscription subscription = new Subscription();
        subscription.setSubscriber(subscriber);
        subscription.setTarget(target);
        subscription.setCreatedAt(LocalDateTime.now());

        SubscriptionResponse response = subscriptionUtils.toResponse(subscriptionRepository.save(subscription));
        notificationUtils.notifyTargetOfFollow(target, subscriber);
        return response;
    }

    // Delete: remove your own follow (or admin).
    public void unfollow(Long targetId) {
        subscriptionUtils.findUser(targetId);
        Subscription subscription = subscriptionRepository
                .findBySubscriberIdAndTargetId(securityContext.getId(), targetId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow not found for this user."));
        subscriptionUtils.checkPermission(subscription);
        subscriptionRepository.delete(subscription);
    }
}
