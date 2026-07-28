package com.acme.model;

/**
 * Pure Java - Test same class name in DIFFERENT package (ambiguity test)
 * This User class is in com.acme.model
 * There's another User in com.example.model
 */
public class User {
    private String username;
    private String password;
    
    public String getUsername() {
        return username;
    }
}
