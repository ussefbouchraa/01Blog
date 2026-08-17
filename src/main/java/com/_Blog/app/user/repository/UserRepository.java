package com._Blog.app.user.repository;

import com._Blog.app.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

// save()
// findById()
// findAll()
// delete()
// deleteById()


// find user by username
// find user by email
// find users by role
}