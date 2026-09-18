package com._Blog.app.like.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com._Blog.app.exception.BlogExceptions.ResourceAlreadyExistsException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.like.dto.LikeResponse;
import com._Blog.app.like.entity.Like;
import com._Blog.app.like.repository.LikeRepository;
import com._Blog.app.post.entity.Post;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.user.entity.User;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final SecurityContext securityContext;
    private final LikeUtils likeUtils;

    public LikeService(LikeRepository likeRepository, SecurityContext securityContext, LikeUtils likeUtils) {
        this.likeRepository = likeRepository;
        this.securityContext = securityContext;
        this.likeUtils = likeUtils;
    }

    // List: who liked this post, oldest first.
    public List<LikeResponse> getLikesByPostId(Long postId) {
        likeUtils.findPost(postId);
        return likeRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(likeUtils::toResponse).toList();
    }

    // Create: one like per user per post (JWT user + post in the URL).
    public LikeResponse likePost(Long postId) {
        Post post = likeUtils.findPost(postId);
        User user = likeUtils.findCurrentUser();

        if (likeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            throw new ResourceAlreadyExistsException("You already liked this post.");
        }

        Like like = new Like();
        like.setPost(post);
        like.setUser(user);
        like.setCreatedAt(LocalDateTime.now());

        return likeUtils.toResponse(likeRepository.save(like));
    }

    // Delete: remove your own like (or admin).
    public void unlikePost(Long postId) {
        likeUtils.findPost(postId);
        Like like = likeRepository.findByPostIdAndUserId(postId, securityContext.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Like not found for this post."));
        likeUtils.checkPermission(like);
        likeRepository.delete(like);
    }
}
