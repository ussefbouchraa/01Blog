package com._Blog.app.notification.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.notification.entity.Notification;
import com._Blog.app.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<Notification> getMyNotifications() {
        return notificationService.getMine();
    }

    @GetMapping("/unread")
    public List<Notification> getUnreadNotifications() {
        return notificationService.getUnreadMine();
    }

    @GetMapping("/unread-count")
    public long getUnreadCount() {
        return notificationService.getUnreadCount();
    }

    @PatchMapping("/{id}/read")
    public void markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
    }
}