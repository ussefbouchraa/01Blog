package com._Blog.app.report.dto;

import java.time.LocalDateTime;

import com._Blog.app.post.dto.AuthorResponse;

public class ReportResponse {
    private Long id;
    private AuthorResponse reporter;
    private AuthorResponse reportedUser;
    private Long reportedPostId;
    private String reason;
    private String status;
    private LocalDateTime createdAt;

    public ReportResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AuthorResponse getReporter() {
        return reporter;
    }

    public void setReporter(AuthorResponse reporter) {
        this.reporter = reporter;
    }

    public AuthorResponse getReportedUser() {
        return reportedUser;
    }

    public void setReportedUser(AuthorResponse reportedUser) {
        this.reportedUser = reportedUser;
    }

    public Long getReportedPostId() {
        return reportedPostId;
    }

    public void setReportedPostId(Long reportedPostId) {
        this.reportedPostId = reportedPostId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
