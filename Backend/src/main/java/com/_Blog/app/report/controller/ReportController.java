package com._Blog.app.report.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.report.dto.ReportRequest;
import com._Blog.app.report.dto.ReportResponse;
import com._Blog.app.report.service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public List<ReportResponse> getAllReports() {
        return reportService.getAllReports();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse createReport(@RequestBody ReportRequest request) {
        return reportService.createReport(request);
    }
}
