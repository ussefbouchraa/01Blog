package com._Blog.app.user.service;

import java.util.List;
import com._Blog.app.user.entity.User;
import org.springframework.stereotype.Service;
import com._Blog.app.user.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;

    // Constructor injection is preferred over @Autowired on fields
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Retrieve all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Retrieve a single user by ID
    // If the database returns empty, we throw our custom exception!
    // The GlobalExceptionHandler will catch it and return a 404 response.
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(
                        () -> new com._Blog.app.exception.BlogExceptions.ResourceNotFoundException("User not found with id: " + id));
    }
}
