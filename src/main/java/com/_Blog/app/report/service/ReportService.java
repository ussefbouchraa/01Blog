package com._Blog.app.report.service;

import java.util.List;
import com._Blog.app.report.entity.Report;
import org.springframework.stereotype.Service;
import com._Blog.app.report.repository.ReportRepository;

@Service
public class ReportService {

    private final ReportRepository reportRepository;

    // Constructor injection is preferred over @Autowired on fields
    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    // Retrieve all reports
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }
}
