package com.example.interfaces;

import java.util.List;

/**
 * User service interface
 */
public interface IUserService {
    User findById(Long id);
    List<User> findAll();
    User save(User user);
    void delete(Long id);
}

/**
 * Auditable interface for tracking changes
 */
public interface IAuditable {
    void setCreatedAt(LocalDateTime timestamp);
    void setUpdatedAt(LocalDateTime timestamp);
}

/**
 * Serializable marker interface
 */
public interface ISerializable {
    String serialize();
}

/**
 * Implementation of user service interface
 */
public class UserServiceImpl implements IUserService {
    private UserRepository repository;
    
    public UserServiceImpl(UserRepository repository) {
        this.repository = repository;
    }
    
    @Override
    public User findById(Long id) {
        return repository.findById(id);
    }
    
    @Override
    public List<User> findAll() {
        return repository.findAll();
    }
    
    @Override
    public User save(User user) {
        return repository.save(user);
    }
    
    @Override
    public void delete(Long id) {
        repository.delete(id);
    }
}

/**
 * Class implementing multiple interfaces
 */
public class AuditableUser implements IAuditable, ISerializable {
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String name;
    
    @Override
    public void setCreatedAt(LocalDateTime timestamp) {
        this.createdAt = timestamp;
    }
    
    @Override
    public void setUpdatedAt(LocalDateTime timestamp) {
        this.updatedAt = timestamp;
    }
    
    @Override
    public String serialize() {
        return name + "," + createdAt + "," + updatedAt;
    }
}

/**
 * Another implementation with multiple interfaces
 */
public class MultiImpl implements IUserService, IAuditable {
    private UserRepository repository;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Override
    public User findById(Long id) {
        return repository.findById(id);
    }
    
    @Override
    public List<User> findAll() {
        return repository.findAll();
    }
    
    @Override
    public User save(User user) {
        return repository.save(user);
    }
    
    @Override
    public void delete(Long id) {
        repository.delete(id);
    }
    
    @Override
    public void setCreatedAt(LocalDateTime timestamp) {
        this.createdAt = timestamp;
    }
    
    @Override
    public void setUpdatedAt(LocalDateTime timestamp) {
        this.updatedAt = timestamp;
    }
}
