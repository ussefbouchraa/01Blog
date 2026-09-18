package com._Blog.app.comment.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com._Blog.app.comment.dto.CommentRequest;
import com._Blog.app.comment.dto.CommentResponse;
import com._Blog.app.comment.entity.Comment;
import com._Blog.app.comment.repository.CommentRepository;
import com._Blog.app.post.entity.Post;
import com._Blog.app.user.entity.User;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentUtils commentUtils;

    public CommentService(CommentRepository commentRepository, CommentUtils commentUtils) {
        this.commentRepository = commentRepository;
        this.commentUtils = commentUtils;
    }

    // List: comments on one post, oldest first.
    public List<CommentResponse> getCommentsByPostId(Long postId) {
        commentUtils.findPost(postId);
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(commentUtils::toResponse).toList();
    }

    // Create: author comes from JWT, post comes from the URL.
    public CommentResponse createComment(Long postId, CommentRequest request) {
        Post post = commentUtils.findPost(postId);
        User author = commentUtils.findCurrentUser();

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setContent(commentUtils.requireContent(request == null ? null : request.getContent()));
        comment.setCreatedAt(LocalDateTime.now());

        return commentUtils.toResponse(commentRepository.save(comment));
    }

    // Update: only the comment author or an admin.
    public CommentResponse updateComment(Long id, CommentRequest request) {
        Comment comment = commentUtils.findComment(id);
        commentUtils.checkPermission(comment);
        comment.setContent(commentUtils.requireContent(request == null ? null : request.getContent()));
        return commentUtils.toResponse(commentRepository.save(comment));
    }

    // Delete: same owner/admin rule as update.
    public void deleteComment(Long id) {
        Comment comment = commentUtils.findComment(id);
        commentUtils.checkPermission(comment);
        commentRepository.delete(comment);
    }
}
