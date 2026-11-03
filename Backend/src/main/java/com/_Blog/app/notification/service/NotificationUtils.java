package com._Blog.app.notification.service;

import org.springframework.stereotype.Component;

import com._Blog.app.exception.BlogExceptions.ForbiddenException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.notification.entity.Notification;
import com._Blog.app.notification.repository.NotificationRepository;
import com._Blog.app.post.entity.Post;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.subscription.repository.SubscriptionRepository;
import com._Blog.app.user.entity.User;

@Component
public class NotificationUtils {

    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SecurityContext securityContext;

    public NotificationUtils(NotificationRepository notificationRepository,
            SubscriptionRepository subscriptionRepository, SecurityContext securityContext) {
        this.notificationRepository = notificationRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.securityContext = securityContext;
    }

    public Notification create(User recipient, Post relatedPost, String type, String message) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setRelatedPost(relatedPost);
        notification.setType(type);
        notification.setMessage(message);
        return notificationRepository.save(notification);
    }

    // POST → subscribers
    public void notifyFollowersOfNewPost(Post post) {
        subscriptionRepository.findByTargetIdOrderByCreatedAtAsc(post.getAuthor().getId()).stream()
                .map(subscription -> subscription.getSubscriber())
                .forEach(follower -> create(follower, post, "new_post",
                        "@" + post.getAuthor().getUsername() + " published a new post"));
    }

    // LIKE → post author
    public void notifyPostAuthorOfLike(User actor, Post post) {
        if (!isOwnAction(actor, post)) {
            create(post.getAuthor(), post, "like", "@" + actor.getUsername() + " liked your post");
        }
    }

    // COMMENT → post author
    public void notifyPostAuthorOfComment(User actor, Post post, String commentContent) {
        if (!isOwnAction(actor, post)) {
            create(post.getAuthor(), post, "comment",
                    "@" + actor.getUsername() + " commented: " + snippet(commentContent));
        }
    }

    // FOLLOW → target user
    public void notifyTargetOfFollow(User target, User subscriber) {
        create(target, null, "follow", "@" + subscriber.getUsername() + " started following you");
    }

    // Owner of the notification or admin only.
    public void checkPermission(Notification notification) {
        if (!notification.getRecipient().getId().equals(securityContext.getId()) && !securityContext.isAdmin()) {
            throw new ForbiddenException("You are not allowed to modify this notification.");
        }
    }

    public Notification findNotification(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
    }

    private boolean isOwnAction(User actor, Post post) {
        return actor.getId().equals(post.getAuthor().getId());
    }

    private String snippet(String content) {
        if (content == null) {
            return "";
        }
        return content.length() <= 60 ? content : content.substring(0, 60) + "...";
    }
}