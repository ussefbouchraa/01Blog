package com._Blog.app.feed.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com._Blog.app.feed.service.FeedService;
import com._Blog.app.post.dto.PostResponse;

@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping
    public List<PostResponse> getSubscribedFeed() {
        return feedService.getSubscribedFeed();
    }
}
