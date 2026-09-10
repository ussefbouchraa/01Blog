package com._Blog.app.post.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com._Blog.app.exception.BlogExceptions.BadRequestException;
import com._Blog.app.exception.BlogExceptions.ForbiddenException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.dto.PostRequest;
import com._Blog.app.post.dto.PostResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final SecurityContext securityContext;

    public PostService(PostRepository postRepository, UserRepository userRepository, SecurityContext securityContext) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.securityContext = securityContext;
    }

    public List<PostResponse> getAllPosts() {
        return postRepository.findAll().stream().map(this::toResponse).toList();
    }

    public PostResponse getPostById(Long id) {
        return toResponse(findPost(id));
    }

    public PostResponse createPost(PostRequest request) {
        User author = userRepository.findById(securityContext.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + securityContext.getId()));

        LocalDateTime now = LocalDateTime.now();
        Post post = new Post();
        post.setAuthor(author);
        post.setContent(requireContent(request));
        post.setHidden(false);
        post.setCreatedAt(now);
        post.setUpdatedAt(now);

        return toResponse(postRepository.save(post));
    }

    public PostResponse updatePost(Long id, PostRequest request) {
        Post post = findPost(id);
        checkPermission(post);

        post.setContent(requireContent(request));
        post.setUpdatedAt(LocalDateTime.now());

        return toResponse(postRepository.save(post));
    }

    public void deletePost(Long id) {
        Post post = findPost(id);
        checkPermission(post);
        postRepository.delete(post);
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
    }

    private void checkPermission(Post post) {
        Long authorId = post.getAuthor().getId();
        if (!authorId.equals(securityContext.getId()) && !securityContext.isAdmin()) {
            throw new ForbiddenException("You are not allowed to modify this post.");
        }
    }

    private String requireContent(PostRequest request) {
        if (request == null || request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("Post content is required.");
        }
        return request.getContent().trim();
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
