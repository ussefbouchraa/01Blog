package com._Blog.app.report.repository;

import com._Blog.app.report.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    // save()
    // findById()
    // findAll()
    // delete()
    // deleteById()

    // find reports by reporter id
    // find reports by reported user id
    // find reports by reported post id
    // find reports by status (e.g. "pending")
}
