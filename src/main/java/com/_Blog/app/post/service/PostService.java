package com._Blog.app.post.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com._Blog.app.exception.BlogExceptions.BadRequestException;
import com._Blog.app.exception.BlogExceptions.ForbiddenException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.post.dto.AuthorResponse;
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
    private final PostFileService postFileService;

    public PostService(PostRepository postRepository, UserRepository userRepository, SecurityContext securityContext,
            PostFileService postFileService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.securityContext = securityContext;
        this.postFileService = postFileService;
    }

    public List<PostResponse> getAllPosts() {
        return postRepository.findAll().stream().map(this::toResponse).toList();
    }

    public PostResponse getPostById(Long id) {
        return toResponse(findPost(id));
    }

    // Create: text is required, file is optional.
    public PostResponse createPost(String content, MultipartFile file) {
        User author = userRepository.findById(securityContext.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + securityContext.getId()));

        LocalDateTime now = LocalDateTime.now();
        Post post = new Post();
        post.setAuthor(author);
        post.setContent(requireContent(content));
        post.setHidden(false);
        post.setCreatedAt(now);
        post.setUpdatedAt(now);
        postFileService.attach(post, file);

        return toResponse(postRepository.save(post));
    }

    // Update: change text, replace file only if a new one is sent.
    public PostResponse updatePost(Long id, String content, MultipartFile file) {
        Post post = findPost(id);
        checkPermission(post);
        post.setContent(requireContent(content));
        post.setUpdatedAt(LocalDateTime.now());
        postFileService.attach(post, file);
        return toResponse(postRepository.save(post));
    }

    // Delete row, then delete the file.
    public void deletePost(Long id) {
        Post post = findPost(id);
        checkPermission(post);
        String mediaUrl = post.getMediaUrl();
        postRepository.delete(post);
        postFileService.delete(mediaUrl);
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
    }

    private void checkPermission(Post post) {
        if (!post.getAuthor().getId().equals(securityContext.getId()) && !securityContext.isAdmin()) {
            throw new ForbiddenException("You are not allowed to modify this post.");
        }
    }

    private String requireContent(String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Post content is required.");
        }
        return content.trim();
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
