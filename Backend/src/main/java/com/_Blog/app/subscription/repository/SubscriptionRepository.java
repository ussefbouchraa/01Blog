package com._Blog.app.subscription.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com._Blog.app.subscription.entity.Subscription;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByTargetIdOrderByCreatedAtAsc(Long targetId);

    List<Subscription> findBySubscriberIdOrderByCreatedAtAsc(Long subscriberId);

    Optional<Subscription> findBySubscriberIdAndTargetId(Long subscriberId, Long targetId);

    boolean existsBySubscriberIdAndTargetId(Long subscriberId, Long targetId);
}
