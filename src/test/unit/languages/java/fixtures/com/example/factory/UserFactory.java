package com.example.factory;

import com.example.model.User;

/**
 * Factory in separate package - for creates relationship testing
 */
public class UserFactory {
    public static User createDefault() {
        return new User();  // Creates User from different package
    }
    
    public static User createWithEmail(String email) {
        User user = new User();
        return user;
    }
}
