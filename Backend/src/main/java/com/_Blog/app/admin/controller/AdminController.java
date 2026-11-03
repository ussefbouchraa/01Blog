package com._Blog.app.admin.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.admin.service.AdminService;
import com._Blog.app.post.dto.PostResponse;
import com._Blog.app.report.dto.ReportResponse;
import com._Blog.app.user.dto.UserResponse;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public List<UserResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
    }

    @GetMapping("/posts")
    public List<PostResponse> getAllPosts() {
        return adminService.getAllPosts();
    }

    @PatchMapping("/posts/{id}/hide")
    public PostResponse hidePost(@PathVariable Long id, @RequestBody(required = false) Boolean hidden) {
        return adminService.hidePost(id, hidden);
    }

    @DeleteMapping("/posts/{id}")
    public void deletePost(@PathVariable Long id) {
        adminService.deletePost(id);
    }

    @GetMapping("/reports")
    public List<ReportResponse> getAllReports() {
        return adminService.getAllReports();
    }

    @PatchMapping("/reports/{id}/resolve")
    public ReportResponse resolveReport(@PathVariable Long id) {
        return adminService.resolveReport(id);
    }
}
