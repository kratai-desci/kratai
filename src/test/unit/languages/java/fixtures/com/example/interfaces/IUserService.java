package com.example.interfaces;

import com.example.model.User;

/**
 * Pure Java - Service interface in separate package (for implements testing)
 */
public interface IUserService {
    User findById(Long id);
    void save(User user);
}
