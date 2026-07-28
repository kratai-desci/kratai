package com.example.service;

import java.util.List;
import java.util.Optional;

/**
 * Base service with common functionality
 */
public abstract class BaseService {
    protected String serviceName;
    
    public abstract void initialize();
    
    protected void log(String message) {
        System.out.println(serviceName + ": " + message);
    }
}

/**
 * User service that extends BaseService
 */
public class UserService extends BaseService {
    private UserRepository repository;
    private int maxRetries;
    public String description;
    
    public UserService(UserRepository repository) {
        this.repository = repository;
        this.maxRetries = 3;
        this.serviceName = "UserService";
    }
    
    @Override
    public void initialize() {
        log("Initializing user service");
    }
    
    public User findById(Long id) {
        return repository.findById(id);
    }
    
    public List<User> findAll() {
        return repository.findAll();
    }
    
    public User save(User user) {
        validate(user);
        return repository.save(user);
    }
    
    private void validate(User user) {
        if (user.getName() == null) {
            throw new IllegalArgumentException("Name cannot be null");
        }
    }
}

/**
 * Repository for data access
 */
public class UserRepository {
    private DatabaseConnection connection;
    
    public User findById(Long id) {
        return connection.query("SELECT * FROM users WHERE id = ?", id);
    }
    
    public List<User> findAll() {
        return connection.query("SELECT * FROM users");
    }
    
    public User save(User user) {
        return connection.insert(user);
    }
}

/**
 * Domain model
 */
public class User {
    private Long id;
    private String name;
    private String email;
    
    public User(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    
    public Long getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
}

/**
 * Database connection utility
 */
public class DatabaseConnection {
    private String connectionString;
    
    public <T> T query(String sql, Object... params) {
        // Implementation
        return null;
    }
    
    public <T> T insert(T entity) {
        // Implementation
        return entity;
    }
}
