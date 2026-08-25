package com._Blog.app.like.repository;

import com._Blog.app.like.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {

    // save()
    // findById()
    // findAll()
    // delete()
    // deleteById()

    // find likes by post id
    // find likes by user id
    // count likes by post id
}
