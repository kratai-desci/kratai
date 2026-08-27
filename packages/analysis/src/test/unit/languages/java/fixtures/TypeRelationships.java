package com.example.types;

import java.util.List;
import java.util.Optional;

/**
 * Service demonstrating type relationships
 */
public class UserService {
    // Field type - composition relationship (with different visibility levels)
    private UserRepository repository;  // Private
    protected EmailService emailService;  // Protected
    public Logger logger;  // Public
    
    public UserService(UserRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
        this.logger = new Logger();
    }
    
    // Return type relationship
    public User findById(Long id) {
        logger.log("Finding user: " + id);
        return repository.findById(id);
    }
    
    // Return type with generic
    public List<User> findAll() {
        return repository.findAll();
    }
    
    // Return type with Optional
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email);
    }
    
    // Parameter type relationship
    public User createUser(UserDTO dto) {
        User user = new User(dto.getName(), dto.getEmail());
        User savedUser = repository.save(user);
        emailService.sendWelcome(savedUser);
        return savedUser;
    }
    
    // Multiple parameter types
    public void updateUser(Long id, UserDTO dto, ValidationContext context) {
        User user = repository.findById(id);
        if (context.isValid(dto)) {
            user.update(dto);
            repository.save(user);
        }
    }
    
    // Complex return type
    public ServiceResponse<User> registerUser(RegistrationRequest request) {
        User user = createUser(request.toDTO());
        return new ServiceResponse<>(user, "User registered successfully");
    }
}

/**
 * Repository with field types
 */
public class UserRepository {
    private DatabaseConnection connection;
    private CacheManager cache;
    
    public User findById(Long id) {
        User cached = cache.get(id);
        if (cached != null) {
            return cached;
        }
        return connection.query("SELECT * FROM users WHERE id = ?", id);
    }
    
    public List<User> findAll() {
        return connection.queryList("SELECT * FROM users");
    }
    
    public Optional<User> findByEmail(String email) {
        return Optional.ofNullable(
            connection.query("SELECT * FROM users WHERE email = ?", email)
        );
    }
    
    public User save(User user) {
        User saved = connection.save(user);
        cache.put(saved.getId(), saved);
        return saved;
    }
}

/**
 * Domain model
 */
public class User {
    private Long id;
    private String name;
    private String email;
    private Profile profile;
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    public void update(UserDTO dto) {
        this.name = dto.getName();
        this.email = dto.getEmail();
    }
    
    public Long getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public Profile getProfile() {
        return profile;
    }
}

/**
 * Data Transfer Object
 */
public class UserDTO {
    private String name;
    private String email;
    
    public String getName() {
        return name;
    }
    
    public String getEmail() {
        return email;
    }
}

/**
 * Supporting classes
 */
public class EmailService {
    public void sendWelcome(User user) {
        // Implementation
    }
}

public class Logger {
    public void log(String message) {
        System.out.println(message);
    }
}

public class ValidationContext {
    public boolean isValid(UserDTO dto) {
        return dto.getName() != null && dto.getEmail() != null;
    }
}

public class RegistrationRequest {
    public UserDTO toDTO() {
        return new UserDTO();
    }
}

public class ServiceResponse<T> {
    private T data;
    private String message;
    
    public ServiceResponse(T data, String message) {
        this.data = data;
        this.message = message;
    }
}

public class Profile {
    private String bio;
    private String avatar;
}

public class DatabaseConnection {
    public <T> T query(String sql, Object... params) {
        return null;
    }
    
    public <T> List<T> queryList(String sql, Object... params) {
        return null;
    }
    
    public <T> T save(T entity) {
        return entity;
    }
}

public class CacheManager {
    public <T> T get(Object key) {
        return null;
    }
    
    public <T> void put(Object key, T value) {
    }
}
