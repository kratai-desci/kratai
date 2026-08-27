package com.example.lambdas;

import java.util.List;
import java.util.function.*;

/**
 * Functional interface for custom operations
 */
@FunctionalInterface
public interface UserProcessor {
    void process(User user);
}

/**
 * Another functional interface
 */
@FunctionalInterface
public interface UserValidator {
    boolean validate(User user);
}

/**
 * Functional interface with generic
 */
@FunctionalInterface
public interface Transformer<T, R> {
    R transform(T input);
}

/**
 * Service using lambda expressions
 */
public class UserService {
    private List<User> users;
    
    public void processUsers(UserProcessor processor) {
        users.forEach(processor::process);
    }
    
    public void processWithLambda() {
        // Lambda expression
        users.forEach(user -> {
            System.out.println("Processing: " + user.getName());
            user.setActive(true);
        });
    }
    
    public List<User> filterUsers(UserValidator validator) {
        return users.stream()
            .filter(validator::validate)
            .toList();
    }
    
    public List<User> filterActive() {
        // Lambda with predicate
        return users.stream()
            .filter(user -> user.isActive())
            .toList();
    }
    
    public void updateUsers(Consumer<User> updater) {
        users.forEach(updater);
    }
    
    public void activateAllUsers() {
        // Method reference
        users.forEach(User::activate);
    }
    
    public List<String> getUserNames() {
        // Lambda for mapping
        return users.stream()
            .map(user -> user.getName())
            .toList();
    }
    
    public List<String> getEmailsMethodRef() {
        // Method reference for mapping
        return users.stream()
            .map(User::getEmail)
            .toList();
    }
}

/**
 * Service with various lambda patterns
 */
public class DataProcessor {
    
    public <T, R> List<R> transform(List<T> items, Transformer<T, R> transformer) {
        return items.stream()
            .map(transformer::transform)
            .toList();
    }
    
    public List<User> processUsers(List<User> users) {
        // Multiple lambda operations
        return users.stream()
            .filter(user -> user.getAge() > 18)
            .filter(user -> user.isActive())
            .map(user -> {
                user.setVerified(true);
                return user;
            })
            .toList();
    }
    
    public void executeWithCallback(Runnable callback) {
        // Execute some logic
        System.out.println("Executing...");
        callback.run();
    }
    
    public void processWithLambda() {
        // Lambda as argument
        executeWithCallback(() -> {
            System.out.println("Callback executed");
        });
    }
    
    public Function<User, String> createFormatter() {
        // Lambda expression returning Function
        return user -> user.getName() + " <" + user.getEmail() + ">";
    }
    
    public Predicate<User> createAgePredicate(int minAge) {
        // Lambda with closure
        return user -> user.getAge() >= minAge;
    }
}

/**
 * Calculator with lambda operations
 */
public class Calculator {
    
    @FunctionalInterface
    public interface Operation {
        double apply(double a, double b);
    }
    
    public double calculate(double a, double b, Operation operation) {
        return operation.apply(a, b);
    }
    
    public void performCalculations() {
        // Lambda expressions for operations
        double sum = calculate(10, 5, (a, b) -> a + b);
        double diff = calculate(10, 5, (a, b) -> a - b);
        double product = calculate(10, 5, (a, b) -> a * b);
        double quotient = calculate(10, 5, (a, b) -> a / b);
    }
}

/**
 * Event handler with lambdas
 */
public class EventManager {
    private List<Consumer<Event>> handlers = new ArrayList<>();
    
    public void subscribe(Consumer<Event> handler) {
        handlers.add(handler);
    }
    
    public void emit(Event event) {
        handlers.forEach(handler -> handler.accept(event));
    }
    
    public void setupHandlers() {
        // Subscribe with lambda
        subscribe(event -> {
            System.out.println("Event received: " + event.getName());
        });
        
        // Subscribe with method reference
        subscribe(this::handleEvent);
    }
    
    private void handleEvent(Event event) {
        System.out.println("Handling: " + event.getName());
    }
}

/**
 * Comparator examples with lambdas
 */
public class UserSorter {
    
    public List<User> sortByName(List<User> users) {
        // Lambda comparator
        return users.stream()
            .sorted((u1, u2) -> u1.getName().compareTo(u2.getName()))
            .toList();
    }
    
    public List<User> sortByAge(List<User> users) {
        // Method reference comparator
        return users.stream()
            .sorted(Comparator.comparing(User::getAge))
            .toList();
    }
    
    public List<User> sortByMultiple(List<User> users) {
        // Chained comparator
        return users.stream()
            .sorted(Comparator.comparing(User::getAge)
                             .thenComparing(User::getName))
            .toList();
    }
}

/**
 * Supporting classes
 */
public class User {
    private String name;
    private String email;
    private int age;
    private boolean active;
    private boolean verified;
    
    public String getName() {
        return name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public int getAge() {
        return age;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
    
    public void setVerified(boolean verified) {
        this.verified = verified;
    }
    
    public void activate() {
        this.active = true;
    }
}

public class Event {
    private String name;
    
    public String getName() {
        return name;
    }
}
