package com._Blog.app.subscription.repository;

import com._Blog.app.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    // save()
    // findById()
    // findAll()
    // delete()
    // deleteById()

    // find subscriptions by subscriber id (who does the user follow?)
    // find subscriptions by target id (who follows this user?)
    // check if a subscription already exists between two users
}
