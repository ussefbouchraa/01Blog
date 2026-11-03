package com._Blog.app.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com._Blog.app.notification.entity.Notification;
import com._Blog.app.notification.repository.NotificationRepository;
import com._Blog.app.security.SecurityContext;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationUtils notificationUtils;
    private final SecurityContext securityContext;

    public NotificationService(NotificationRepository notificationRepository, NotificationUtils notificationUtils,
            SecurityContext securityContext) {
        this.notificationRepository = notificationRepository;
        this.notificationUtils = notificationUtils;
        this.securityContext = securityContext;
    }

    public List<Notification> getMine() {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(securityContext.getId());
    }

    public List<Notification> getUnreadMine() {
        return notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(securityContext.getId());
    }

    public long getUnreadCount() {
        return notificationRepository.countByRecipientIdAndIsReadFalse(securityContext.getId());
    }

    public void markAsRead(Long id) {
        Notification notification = notificationUtils.findNotification(id);
        notificationUtils.checkPermission(notification);
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
}