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
}
