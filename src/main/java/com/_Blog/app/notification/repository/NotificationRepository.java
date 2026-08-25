package com._Blog.app.notification.repository;

import com._Blog.app.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // save()
    // findById()
    // findAll()
    // delete()
    // deleteById()

    // find notifications by recipient id
    // find unread notifications by recipient id
    // count unread notifications for a user
}
