package com._Blog.app.user.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.user.dto.UserResponse;
import com._Blog.app.user.entity.User;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.dto.PostResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public UserService(UserRepository userRepository, PostRepository postRepository) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
    }

    // List: public profiles only.
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    // One profile by id, or 404.
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toResponse(user);
    }

    // DTO: no email, password hash, or role.
    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setBio(user.getBio());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    public List<PostResponse> getUserPosts(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return postRepository.findAll().stream()
                .filter(post -> post.getAuthor().getId().equals(id))
                .map(this::toPostResponse)
                .toList();
    }

    private PostResponse toPostResponse(Post post) {
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