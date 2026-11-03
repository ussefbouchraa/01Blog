package com._Blog.app.post.repository;

import com._Blog.app.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    // save()
    // findById()
    // findAll()
    // delete()
    // deleteById()

    // find posts by author id
    // find posts by title containing keyword
}
