package com._Blog.app.comment.repository;

import com._Blog.app.comment.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // save()
    // findById()
    // findAll()
    // delete()
    // deleteById()

    // find comments by post id
    // find comments by author id
}
