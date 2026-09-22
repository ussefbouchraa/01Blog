package com._Blog.app.report.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com._Blog.app.exception.BlogExceptions.BadRequestException;
import com._Blog.app.exception.BlogExceptions.ResourceNotFoundException;
import com._Blog.app.post.dto.AuthorResponse;
import com._Blog.app.post.entity.Post;
import com._Blog.app.post.repository.PostRepository;
import com._Blog.app.report.dto.ReportRequest;
import com._Blog.app.report.dto.ReportResponse;
import com._Blog.app.report.entity.Report;
import com._Blog.app.report.repository.ReportRepository;
import com._Blog.app.security.SecurityContext;
import com._Blog.app.user.entity.User;
import com._Blog.app.user.repository.UserRepository;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final SecurityContext securityContext;

    public ReportService(ReportRepository reportRepository, UserRepository userRepository,
            PostRepository postRepository, SecurityContext securityContext) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.securityContext = securityContext;
    }

    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream().map(this::toResponse).toList();
    }

    public ReportResponse createReport(ReportRequest request) {
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BadRequestException("Reason is required.");
        }

        User reporter = userRepository.findById(securityContext.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + securityContext.getId()));

        User reportedUser = null;
        if (request.getReportedUserId() != null) {
            reportedUser = userRepository.findById(request.getReportedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with id: " + request.getReportedUserId()));
        }

        Post reportedPost = null;
        if (request.getReportedPostId() != null) {
            reportedPost = postRepository.findById(request.getReportedPostId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Post not found with id: " + request.getReportedPostId()));
        }

        if (reportedUser == null && reportedPost == null) {
            throw new BadRequestException("Either reportedUserId or reportedPostId must be provided.");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setReportedUser(reportedUser);
        report.setReportedPost(reportedPost);
        report.setReason(request.getReason().trim());
        report.setStatus("pending");
        report.setCreatedAt(LocalDateTime.now());

        return toResponse(reportRepository.save(report));
    }

    private ReportResponse toResponse(Report report) {
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
