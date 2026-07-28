package com.example.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Basic JPA Entity with Common Patterns
 * 
 * MUST detect:
 * - @Entity annotation
 * - @Table(name = "users") - Table mapping
 * - @Id - Primary key field
 * - @GeneratedValue(strategy = GenerationType.IDENTITY) - Auto-increment
 * - @Column annotations with constraints (unique, nullable, length)
 * - Basic field types (Long, String, boolean, LocalDateTime)
 * - Getter/setter methods
 */
@Entity
@Table(name = "users")
public class User {
    
    // MUST detect: @Id = primary key
    // MUST detect: @GeneratedValue = auto-increment strategy
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // MUST detect: @Column with constraints
    @Column(name = "full_name", nullable = false, length = 100)
    private String name;
    
    // MUST detect: unique constraint
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private boolean active = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // MUST detect: @OneToMany relationship (User -> Posts)
    // MUST detect: mappedBy = "user" (bidirectional)
    // MUST detect: cascade = CascadeType.ALL
    // MUST detect: orphanRemoval = true
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Post> posts = new ArrayList<>();
    
    // MUST detect: @ManyToMany relationship (User <-> Roles)
    // MUST detect: @JoinTable for join table configuration
    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    
    // MUST detect: @OneToOne relationship (User -> Profile)
    // MUST detect: cascade types
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Profile profile;
    
    // Constructors
    public User() {
    }
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
        this.createdAt = LocalDateTime.now();
    }
    
    // MUST detect: @PrePersist lifecycle callback
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    // MUST detect: @PreUpdate lifecycle callback
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public List<Post> getPosts() {
        return posts;
    }
    
    public void setPosts(List<Post> posts) {
        this.posts = posts;
    }
    
    // MUST detect: Helper method for bidirectional relationship
    public void addPost(Post post) {
        posts.add(post);
        post.setUser(this);
    }
    
    public void removePost(Post post) {
        posts.remove(post);
        post.setUser(null);
    }
    
    public Set<Role> getRoles() {
        return roles;
    }
    
    public void setRoles(Set<Role> roles) {
        this.roles = roles;
    }
    
    public Profile getProfile() {
        return profile;
    }
    
    public void setProfile(Profile profile) {
        this.profile = profile;
        if (profile != null) {
            profile.setUser(this);
        }
    }
}
