package com.example.annotations;

import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import javax.persistence.*;
import javax.validation.constraints.*;

/**
 * Spring REST Controller with annotations
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;
    
    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    @PostMapping
    public User createUser(@RequestBody @Valid UserDTO dto) {
        return userService.create(dto);
    }
    
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody @Valid UserDTO dto) {
        return userService.update(id, dto);
    }
    
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}

/**
 * Spring Service with annotations
 */
@Service
public class UserService {
    @Autowired
    private UserRepository repository;
    
    @Autowired
    private EmailService emailService;
    
    public List<User> findAll() {
        return repository.findAll();
    }
    
    public User findById(Long id) {
        return repository.findById(id).orElseThrow();
    }
    
    @Transactional
    public User create(UserDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        User saved = repository.save(user);
        emailService.sendWelcome(saved);
        return saved;
    }
    
    @Transactional
    public User update(Long id, UserDTO dto) {
        User user = findById(id);
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        return repository.save(user);
    }
    
    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }
}

/**
 * Spring Data JPA Repository
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByNameContaining(String name);
    
    @Query("SELECT u FROM User u WHERE u.age > :age")
    List<User> findUsersOlderThan(@Param("age") int age);
}

/**
 * JPA Entity with annotations
 */
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    @NotNull
    @Size(min = 2, max = 100)
    private String name;
    
    @Column(nullable = false, unique = true)
    @NotNull
    @Email
    private String email;
    
    @Column
    private Integer age;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Post> posts;
    
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
    
    // Getters and setters
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
    
    @Override
    public String toString() {
        return "User{id=" + id + ", name='" + name + "'}";
    }
}

/**
 * DTO with validation annotations
 */
public class UserDTO {
    @NotNull
    @Size(min = 2, max = 100)
    private String name;
    
    @NotNull
    @Email
    private String email;
    
    @Min(0)
    @Max(150)
    private Integer age;
    
    public String getName() {
        return name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public Integer getAge() {
        return age;
    }
}

/**
 * Supporting entity classes
 */
@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}

@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @OneToMany(mappedBy = "department")
    private List<User> users;
}

/**
 * Email service
 */
@Service
public class EmailService {
    public void sendWelcome(User user) {
        System.out.println("Sending welcome email to " + user.getEmail());
    }
}

/**
 * Custom annotation example
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
    String action() default "UNKNOWN";
}

/**
 * Service using custom annotation
 */
@Service
public class AuditedService {
    @Audited(action = "USER_CREATED")
    public void createUser(User user) {
        // Implementation
    }
    
    @Audited(action = "USER_DELETED")
    public void deleteUser(Long id) {
        // Implementation
    }
}
