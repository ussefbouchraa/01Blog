package com._Blog.app.report.dto;

public class ReportRequest {
    private Long reportedUserId;
    private Long reportedPostId;
    private String reason;

    public ReportRequest() {
    }

    public Long getReportedUserId() {
        return reportedUserId;
    }

    public void setReportedUserId(Long reportedUserId) {
        this.reportedUserId = reportedUserId;
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
}
