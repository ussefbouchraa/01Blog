package com._Blog.app.post.service;

import java.util.List;
import com._Blog.app.post.entity.Post;
import org.springframework.stereotype.Service;
import com._Blog.app.post.repository.PostRepository;

@Service
public class PostService {

    private final PostRepository postRepository;

    // Constructor injection is preferred over @Autowired on fields
    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    // Retrieve all posts
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }
}
