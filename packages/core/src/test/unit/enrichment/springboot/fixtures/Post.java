package com.example.entity;

import jakarta.persistence.*;

/**
 * Post Entity - Demonstrates @ManyToOne relationship
 * 
 * MUST detect:
 * - @ManyToOne annotation (Post -> User)
 * - @JoinColumn(name = "user_id") - Foreign key column
 * - fetch = FetchType.LAZY - Lazy loading strategy
 * - Bidirectional relationship (inverse of User.posts @OneToMany)
 */
@Entity
@Table(name = "posts")
public class Post {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    // MUST detect: @ManyToOne relationship (many posts belong to one user)
    // MUST detect: @JoinColumn - foreign key mapping
    // MUST detect: fetch = FetchType.LAZY
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // Constructors
    public Post() {
    }
    
    public Post(String title, String content) {
        this.title = title;
        this.content = content;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
}
