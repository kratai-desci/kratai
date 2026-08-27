package com.example.statics;

import static java.lang.Math.max;
import static java.lang.Math.min;

/**
 * Utility class with static methods
 */
public class ValidationUtils {
    private static final int MIN_LENGTH = 3;
    private static final int MAX_LENGTH = 50;
    
    public static boolean isValidEmail(String email) {
        return email != null && email.contains("@");
    }
    
    public static boolean isValidName(String name) {
        return name != null && 
               name.length() >= MIN_LENGTH && 
               name.length() <= MAX_LENGTH;
    }
    
    public static String normalize(String input) {
        if (input == null) {
            return "";
        }
        return input.trim().toLowerCase();
    }
    
    public static int clamp(int value, int minValue, int maxValue) {
        return max(minValue, min(value, maxValue));
    }
}

/**
 * String utilities with static methods
 */
public class StringUtils {
    public static boolean isEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
    
    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }
    
    public static String capitalize(String str) {
        if (isEmpty(str)) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}

/**
 * Service using static method calls
 */
public class UserService {
    private UserRepository repository;
    
    public User createUser(String name, String email) {
        // Static method calls
        if (!ValidationUtils.isValidName(name)) {
            throw new IllegalArgumentException("Invalid name");
        }
        
        if (!ValidationUtils.isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email");
        }
        
        // Normalize using static method
        String normalizedName = ValidationUtils.normalize(name);
        String normalizedEmail = ValidationUtils.normalize(email);
        
        User user = new User(normalizedName, normalizedEmail);
        return repository.save(user);
    }
    
    public User updateUser(Long id, String name) {
        User user = repository.findById(id);
        
        // More static calls
        if (StringUtils.isEmpty(name)) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        
        String capitalizedName = StringUtils.capitalize(name);
        user.setName(capitalizedName);
        
        return repository.save(user);
    }
}

/**
 * Factory with static factory methods
 */
public class UserFactory {
    public static User createDefault() {
        return new User("Default User", "default@example.com");
    }
    
    public static User createFromEmail(String email) {
        String name = email.substring(0, email.indexOf("@"));
        return new User(name, email);
    }
    
    public static User createAdmin(String name, String email) {
        User user = new User(name, email);
        user.setRole("ADMIN");
        return user;
    }
}

/**
 * Service using static factory methods
 */
public class RegistrationService {
    private UserRepository repository;
    
    public User registerWithEmail(String email) {
        // Static factory method call
        User user = UserFactory.createFromEmail(email);
        return repository.save(user);
    }
    
    public User registerAdmin(String name, String email) {
        // Another static factory call
        if (ValidationUtils.isValidEmail(email) && ValidationUtils.isValidName(name)) {
            User admin = UserFactory.createAdmin(name, email);
            return repository.save(admin);
        }
        throw new IllegalArgumentException("Invalid credentials");
    }
    
    public User registerDefault() {
        return repository.save(UserFactory.createDefault());
    }
}

/**
 * Math utilities
 */
public class MathUtils {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static int multiply(int a, int b) {
        return a * b;
    }
    
    public static double average(int... numbers) {
        if (numbers.length == 0) {
            return 0;
        }
        int sum = 0;
        for (int num : numbers) {
            sum = add(sum, num); // Static call to own method
        }
        return (double) sum / numbers.length;
    }
}

/**
 * Supporting classes
 */
public class User {
    private Long id;
    private String name;
    private String email;
    private String role;
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
}

public class UserRepository {
    public User findById(Long id) {
        return null;
    }
    
    public User save(User user) {
        return user;
    }
}
