package com._Blog.app.comment.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.comment.dto.CommentRequest;
import com._Blog.app.comment.dto.CommentResponse;
import com._Blog.app.comment.service.CommentService;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    // Nested under the post: list comments for that post.
    @GetMapping("/api/posts/{postId}/comments")
    public List<CommentResponse> getCommentsByPostId(@PathVariable Long postId) {
        return commentService.getCommentsByPostId(postId);
    }

    // Nested under the post: logged-in user writes a comment.
    @PostMapping("/api/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse createComment(@PathVariable Long postId, @RequestBody CommentRequest request) {
        return commentService.createComment(postId, request);
    }

    // Direct on the comment: edit text (author or admin).
    @PutMapping("/api/comments/{id}")
    public CommentResponse updateComment(@PathVariable Long id, @RequestBody CommentRequest request) {
        return commentService.updateComment(id, request);
    }

    // Direct on the comment: remove it (author or admin).
    @DeleteMapping("/api/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
    }
}
