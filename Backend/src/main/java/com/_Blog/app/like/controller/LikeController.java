package com._Blog.app.like.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.like.dto.LikeResponse;
import com._Blog.app.like.service.LikeService;

@RestController
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    // Nested under the post: list likes for that post.
    @GetMapping("/api/posts/{postId}/likes")
    public List<LikeResponse> getLikesByPostId(@PathVariable Long postId) {
        return likeService.getLikesByPostId(postId);
    }

    // Nested under the post: logged-in user likes it (once).
    @PostMapping("/api/posts/{postId}/like")
    @ResponseStatus(HttpStatus.CREATED)
    public LikeResponse likePost(@PathVariable Long postId) {
        return likeService.likePost(postId);
    }

    // Nested under the post: logged-in user removes their like.
    @DeleteMapping("/api/posts/{postId}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlikePost(@PathVariable Long postId) {
        likeService.unlikePost(postId);
    }
}
