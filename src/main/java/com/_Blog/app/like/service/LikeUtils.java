package com._Blog.app.like.service;

import org.springframework.stereotype.Component;

import com._Blog.app.exception.BlogExceptions.ForbiddenException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.like.dto.LikeResponse;
import com._Blog.app.like.entity.Like;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Component
public class LikeUtils {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SecurityContext securityContext;

    public LikeUtils(PostRepository postRepository, UserRepository userRepository, SecurityContext securityContext) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.securityContext = securityContext;
    }

    public Post findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
    }

    public User findCurrentUser() {
        Long userId = securityContext.getId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    public void checkPermission(Like like) {
        if (!like.getUser().getId().equals(securityContext.getId()) && !securityContext.isAdmin()) {
            throw new ForbiddenException("You are not allowed to remove this like.");
        }
    }

    public LikeResponse toResponse(Like like) {
        User user = like.getUser();
        LikeResponse response = new LikeResponse();
        response.setId(like.getId());
        response.setPostId(like.getPost().getId());
        response.setCreatedAt(like.getCreatedAt());
        response.setUser(new AuthorResponse(user.getId(), user.getUsername(), user.getAvatarUrl()));
        return response;
    }
}
