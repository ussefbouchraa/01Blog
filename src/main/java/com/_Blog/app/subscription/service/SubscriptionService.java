package com._Blog.app.subscription.service;

import java.util.List;
import com._Blog.app.subscription.entity.Subscription;
import org.springframework.stereotype.Service;
import com._Blog.app.subscription.repository.SubscriptionRepository;

@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;

    // Constructor injection is preferred over @Autowired on fields
    public SubscriptionService(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    // Retrieve all subscriptions
    public List<Subscription> getAllSubscriptions() {
        return subscriptionRepository.findAll();
    }
}
