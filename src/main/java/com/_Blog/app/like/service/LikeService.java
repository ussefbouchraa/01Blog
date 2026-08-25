package com._Blog.app.like.service;

import java.util.List;
import com._Blog.app.like.entity.Like;
import org.springframework.stereotype.Service;
import com._Blog.app.like.repository.LikeRepository;

@Service
public class LikeService {

    private final LikeRepository likeRepository;

    // Constructor injection is preferred over @Autowired on fields
    public LikeService(LikeRepository likeRepository) {
        this.likeRepository = likeRepository;
    }

    // Retrieve all likes
    public List<Like> getAllLikes() {
        return likeRepository.findAll();
    }
}
