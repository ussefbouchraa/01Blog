package com._Blog.app.comment.service;

import org.springframework.stereotype.Component;

import com._Blog.app.comment.dto.CommentResponse;
import com._Blog.app.comment.entity.Comment;
import com._Blog.app.comment.repository.CommentRepository;
import com._Blog.app.exception.BlogExceptions.BadRequestException;
import com._Blog.app.exception.BlogExceptions.ForbiddenException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Component
public class CommentUtils {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SecurityContext securityContext;

    public CommentUtils(CommentRepository commentRepository, PostRepository postRepository,
            UserRepository userRepository, SecurityContext securityContext) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.securityContext = securityContext;
    }

    // Load the post or 404.
    public Post findPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
    }

    // Load the comment or 404.
    public Comment findComment(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));
    }

    // Load the logged-in user from JWT.
    public User findCurrentUser() {
        Long userId = securityContext.getId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    // Owner or admin only.
    public void checkPermission(Comment comment) {
        if (!comment.getAuthor().getId().equals(securityContext.getId()) && !securityContext.isAdmin()) {
            throw new ForbiddenException("You are not allowed to modify this comment.");
        }
    }

    // Reject empty text.
    public String requireContent(String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Comment content is required.");
        }
        return content.trim();
    }

    public CommentResponse toResponse(Comment comment) {
        User author = comment.getAuthor();
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setPostId(comment.getPost().getId());
        response.setContent(comment.getContent());
        response.setCreatedAt(comment.getCreatedAt());
        response.setAuthor(new AuthorResponse(author.getId(), author.getUsername(), author.getAvatarUrl()));
        return response;
    }
}
