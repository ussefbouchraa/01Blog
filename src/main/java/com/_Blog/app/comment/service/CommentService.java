package com._Blog.app.comment.service;

import java.util.List;
import com._Blog.app.comment.entity.Comment;
import org.springframework.stereotype.Service;
import com._Blog.app.comment.repository.CommentRepository;

@Service
public class CommentService {

    private final CommentRepository commentRepository;

    // Constructor injection is preferred over @Autowired on fields
    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    // Retrieve all comments
    public List<Comment> getAllComments() {
        return commentRepository.findAll();
    }
}
