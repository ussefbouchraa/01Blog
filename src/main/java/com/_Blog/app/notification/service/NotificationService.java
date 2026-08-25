package com._Blog.app.notification.service;

import java.util.List;
import com._Blog.app.notification.entity.Notification;
import org.springframework.stereotype.Service;
import com._Blog.app.notification.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // Constructor injection is preferred over @Autowired on fields
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    // Retrieve all notifications
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }
}
