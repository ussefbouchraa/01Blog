package com._Blog.app.feed.service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.dto.PostResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.subscription.repository.SubscriptionRepository;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Service
public class FeedService {

    private final SubscriptionRepository subscriptionRepository;
    private final PostRepository postRepository;
    private final SecurityContext securityContext;
    private final UserRepository userRepository;

    public FeedService(SubscriptionRepository subscriptionRepository, PostRepository postRepository,
            SecurityContext securityContext, UserRepository userRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.postRepository = postRepository;
        this.securityContext = securityContext;
        this.userRepository = userRepository;
    }

    public List<PostResponse> getSubscribedFeed() {
        Long userId = securityContext.getId();
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Set<Long> followingIds = subscriptionRepository.findBySubscriberIdOrderByCreatedAtAsc(userId).stream()
                .map(s -> s.getTarget().getId())
                .collect(Collectors.toSet());

        return postRepository.findAll().stream()
                .filter(post -> !post.getHidden())
                .filter(post -> followingIds.contains(post.getAuthor().getId()))
                .sorted(Comparator.comparing(Post::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    private PostResponse toResponse(Post post) {
        User author = post.getAuthor();
        PostResponse response = new PostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setMediaUrl(post.getMediaUrl());
        response.setMediaType(post.getMediaType());
        response.setHidden(post.getHidden());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        response.setAuthor(new AuthorResponse(author.getId(), author.getUsername(), author.getAvatarUrl()));
        return response;
    }
}
