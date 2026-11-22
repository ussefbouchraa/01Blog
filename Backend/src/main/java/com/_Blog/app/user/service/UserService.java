package com._Blog.app.user.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com._Blog.app.exception.BlogExceptions.ForbiddenException;
import com._Blog.app.exception.BlogExceptions.ResourceAlreadyExistsException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.user.dto.OwnUserProfileResponse;
import com._Blog.app.user.dto.UpdateUserRequest;
import com._Blog.app.user.dto.UserResponse;
import com._Blog.app.user.entity.User;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.dto.PostResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.post.service.PostFileService;
import com._Blog.app.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SecurityContext securityContext;
    private final PostFileService postFileService;

    public UserService(UserRepository userRepository, PostRepository postRepository,
            SecurityContext securityContext, PostFileService postFileService) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.securityContext = securityContext;
        this.postFileService = postFileService;
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

    // Returns the authenticated user's own profile (includes email).
    public OwnUserProfileResponse getOwnProfile() {
        Long currentUserId = securityContext.getId();
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));
        return toOwnProfileResponse(user);
    }

    // Updates a user profile. Only the owner or an admin may call this.
    // Null fields in the request are ignored (not overwritten).
    // Role and passwordHash are never modified here.
    public UserResponse updateUser(Long id, UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        checkPermission(user);

        // Username: update only if provided and different
        if (req.getUsername() != null && !req.getUsername().isBlank()
                && !req.getUsername().equals(user.getUsername())) {
            Optional<User> existing = userRepository.findByUsername(req.getUsername());
            if (existing.isPresent()) {
                throw new ResourceAlreadyExistsException("Username is already taken.");
            }
            user.setUsername(req.getUsername());
        }


        // Bio: update if provided (empty string allowed to clear bio)
        if (req.getBio() != null) {
            user.setBio(req.getBio());
        }


        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateAvatar(Long id, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        checkPermission(user);

        String avatarUrl = postFileService.saveAvatar(file, user.getAvatarUrl());
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return toResponse(user);
    }

    // Ownership check: same pattern as PostService.checkPermission().
    private void checkPermission(User user) {
        if (!user.getId().equals(securityContext.getId()) && !securityContext.isAdmin()) {
            throw new ForbiddenException("You are not allowed to modify this profile.");
        }
    }

    // Maps User entity to OwnUserProfileResponse (includes email).
    private OwnUserProfileResponse toOwnProfileResponse(User user) {
        OwnUserProfileResponse response = new OwnUserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setBio(user.getBio());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}