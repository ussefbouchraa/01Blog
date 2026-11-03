package com._Blog.app.like.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com._Blog.app.like.entity.Like;

public interface LikeRepository extends JpaRepository<Like, Long> {

    List<Like> findByPostIdOrderByCreatedAtAsc(Long postId);

    Optional<Like> findByPostIdAndUserId(Long postId, Long userId);

    boolean existsByPostIdAndUserId(Long postId, Long userId);
}
