package com._Blog.app.admin.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.dto.PostResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.post.service.PostFileService;
import com._Blog.app.report.dto.ReportResponse;
import com._Blog.app.report.entity.Report;
import com._Blog.app.report.repository.ReportRepository;
import com._Blog.app.user.dto.UserResponse;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ReportRepository reportRepository;
    private final PostFileService postFileService;

    public AdminService(UserRepository userRepository, PostRepository postRepository,
            ReportRepository reportRepository, PostFileService postFileService) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.reportRepository = reportRepository;
        this.postFileService = postFileService;
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toUserResponse).toList();
    }

    // The User entity cascades the removal to its posts, comments, likes, subscriptions,
    // notifications and reports, so removing the user takes all of that with it.
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.getPosts().forEach(post -> postFileService.deleteAfterCommit(post.getMediaUrl()));
        userRepository.delete(user);
    }

    public List<PostResponse> getAllPosts() {
        return postRepository.findAll().stream().map(this::toPostResponse).toList();
    }

    public PostResponse hidePost(Long id, Boolean hidden) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        post.setHidden(hidden == null ? true : hidden);
        return toPostResponse(postRepository.save(post));
    }

    @Transactional
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        String mediaUrl = post.getMediaUrl();
        postRepository.delete(post);
        postFileService.deleteAfterCommit(mediaUrl);
    }

    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream().map(this::toReportResponse).toList();
    }

    public ReportResponse resolveReport(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        report.setStatus("resolved");
        return toReportResponse(reportRepository.save(report));
    }

    private UserResponse toUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setBio(user.getBio());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setCreatedAt(user.getCreatedAt());
        return response;
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

    private ReportResponse toReportResponse(Report report) {
        ReportResponse response = new ReportResponse();
        response.setId(report.getId());
        response.setReporter(toAuthor(report.getReporter()));
        response.setReportedUser(report.getReportedUser() != null ? toAuthor(report.getReportedUser()) : null);
        response.setReportedPostId(report.getReportedPost() != null ? report.getReportedPost().getId() : null);
        response.setReason(report.getReason());
        response.setStatus(report.getStatus());
        response.setCreatedAt(report.getCreatedAt());
        return response;
    }

    private AuthorResponse toAuthor(User user) {
        if (user == null) {
            return null;
        }
        return new AuthorResponse(user.getId(), user.getUsername(), user.getAvatarUrl());
    }
}
