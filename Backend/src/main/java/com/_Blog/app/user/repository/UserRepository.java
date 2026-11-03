package com._Blog.app.user.repository;

import com._Blog.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    // save()
    // findById()
    // findAll()
    // delete()
    // deleteById()

    // Spring Data JPA automatically writes the SQL for these based on the method
    // names!
    java.util.Optional<User> findByUsername(String username);

    java.util.Optional<User> findByEmail(String email);

    // find users by role
    // find users by role
}