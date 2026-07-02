package com.example.factory;

/**
 * Simple factory pattern with new operator
 */
public class UserFactory {
    public User createUser(String name, String email) {
        return new User(name, email);
    }
    
    public User createAdmin(String name, String email) {
        User admin = new User(name, email);
        admin.setRole("ADMIN");
        return admin;
    }
    
    public User createGuest() {
        return new User("Guest", "guest@example.com");
    }
}

/**
 * Factory method pattern
 */
public abstract class NotificationFactory {
    public abstract Notification createNotification();
    
    public void sendNotification(String message) {
        Notification notification = createNotification();
        notification.send(message);
    }
}

public class EmailNotificationFactory extends NotificationFactory {
    @Override
    public Notification createNotification() {
        return new EmailNotification();
    }
}

public class SMSNotificationFactory extends NotificationFactory {
    @Override
    public Notification createNotification() {
        return new SMSNotification();
    }
}

/**
 * Abstract factory pattern
 */
public interface UIFactory {
    Button createButton();
    TextField createTextField();
}

public class DarkThemeFactory implements UIFactory {
    @Override
    public Button createButton() {
        return new DarkButton();
    }
    
    @Override
    public TextField createTextField() {
        return new DarkTextField();
    }
}

public class LightThemeFactory implements UIFactory {
    @Override
    public Button createButton() {
        return new LightButton();
    }
    
    @Override
    public TextField createTextField() {
        return new LightTextField();
    }
}

/**
 * Builder pattern
 */
public class UserBuilder {
    private String name;
    private String email;
    private int age;
    private String role;
    
    public UserBuilder setName(String name) {
        this.name = name;
        return this;
    }
    
    public UserBuilder setEmail(String email) {
        this.email = email;
        return this;
    }
    
    public UserBuilder setAge(int age) {
        this.age = age;
        return this;
    }
    
    public UserBuilder setRole(String role) {
        this.role = role;
        return this;
    }
    
    public User build() {
        User user = new User(name, email);
        user.setAge(age);
        user.setRole(role);
        return user;
    }
}

/**
 * Service using factories
 */
public class UserService {
    private UserFactory userFactory;
    private EmailNotificationFactory notificationFactory;
    
    public UserService() {
        this.userFactory = new UserFactory();
        this.notificationFactory = new EmailNotificationFactory();
    }
    
    public User registerUser(String name, String email) {
        User user = userFactory.createUser(name, email);
        
        Notification notification = notificationFactory.createNotification();
        notification.send("Welcome " + name);
        
        return user;
    }
    
    public User createAdminUser(String name, String email) {
        return userFactory.createAdmin(name, email);
    }
}

/**
 * Singleton pattern with instance creation
 */
public class DatabaseConnection {
    private static DatabaseConnection instance;
    
    private DatabaseConnection() {
        // Private constructor
    }
    
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            instance = new DatabaseConnection();
        }
        return instance;
    }
}

/**
 * Service using builder
 */
public class RegistrationService {
    public User registerWithBuilder(String name, String email, int age) {
        return new UserBuilder()
            .setName(name)
            .setEmail(email)
            .setAge(age)
            .setRole("USER")
            .build();
    }
}

/**
 * Supporting classes
 */
public class User {
    private String name;
    private String email;
    private int age;
    private String role;
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    public void setAge(int age) {
        this.age = age;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
}

public interface Notification {
    void send(String message);
}

public class EmailNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}

public class SMSNotification implements Notification {
    @Override
    public void send(String message) {
        System.out.println("SMS: " + message);
    }
}

public interface Button {
    void render();
}

public class DarkButton implements Button {
    @Override
    public void render() {
        System.out.println("Dark button");
    }
}

public class LightButton implements Button {
    @Override
    public void render() {
        System.out.println("Light button");
    }
}

public interface TextField {
    void render();
}

public class DarkTextField implements TextField {
    @Override
    public void render() {
        System.out.println("Dark text field");
    }
}

public class LightTextField implements TextField {
    @Override
    public void render() {
        System.out.println("Light text field");
    }
}
