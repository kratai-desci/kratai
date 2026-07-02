package com.example.interfaces;

import com.example.model.User;

/**
 * Service interface in separate package - for implements testing
 */
public interface IUserService {
    User findById(Long id);
    void save(User user);
}
