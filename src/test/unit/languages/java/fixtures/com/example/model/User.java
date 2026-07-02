package com.example.model;

/**
 * Pure Java - Domain model in separate package
 */
public class User {
    private Long id;
    private String name;
    private String email;
    
    public Long getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
    
    public String getEmail() {
        return email;
    }
}
