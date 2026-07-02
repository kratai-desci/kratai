package com.example.service;

import com.example.repository.UserRepository;
import com.example.model.User;
import com.example.dto.UserDTO;
import com.example.interfaces.IUserService;
import com.example.factory.UserFactory;
import java.util.List;

/**
 * Test comprehensive cross-package relationships
 * - Implements IUserService (different package)
 * - Uses UserRepository (composition)
 * - Generic type: List<User>
 * - Calls UserFactory.createDefault() (static call to factory)
 */
public class UserService implements IUserService {
    private UserRepository repository;
    private List<User> cache;
    
    public UserService(UserRepository repository) {
        this.repository = repository;
    }
    
    @Override
    public User findById(Long id) {
        return repository.findById(id);
    }
    
    @Override
    public void save(User user) {
        repository.save(user);
    }
    
    public User create(UserDTO dto) {
        User user = UserFactory.createDefault();
        return user;
    }
}
