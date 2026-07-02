package com.example.streams;

import java.util.*;
import java.util.stream.*;

/**
 * Service demonstrating Stream API usage
 */
public class UserService {
    private List<User> users;
    
    public List<User> getActiveUsers() {
        return users.stream()
            .filter(user -> user.isActive())
            .collect(Collectors.toList());
    }
    
    public List<String> getUserNames() {
        return users.stream()
            .map(User::getName)
            .collect(Collectors.toList());
    }
    
    public List<User> getAdultUsers() {
        return users.stream()
            .filter(user -> user.getAge() >= 18)
            .sorted(Comparator.comparing(User::getName))
            .collect(Collectors.toList());
    }
    
    public long countActiveUsers() {
        return users.stream()
            .filter(User::isActive)
            .count();
    }
    
    public Optional<User> findUserByEmail(String email) {
        return users.stream()
            .filter(user -> user.getEmail().equals(email))
            .findFirst();
    }
    
    public Map<String, List<User>> groupByRole() {
        return users.stream()
            .collect(Collectors.groupingBy(User::getRole));
    }
    
    public Map<Boolean, List<User>> partitionByActive() {
        return users.stream()
            .collect(Collectors.partitioningBy(User::isActive));
    }
    
    public double getAverageAge() {
        return users.stream()
            .mapToInt(User::getAge)
            .average()
            .orElse(0.0);
    }
    
    public Set<String> getUniqueEmails() {
        return users.stream()
            .map(User::getEmail)
            .collect(Collectors.toSet());
    }
    
    public String concatenateNames() {
        return users.stream()
            .map(User::getName)
            .collect(Collectors.joining(", "));
    }
}

/**
 * Data processor with complex stream operations
 */
public class DataProcessor {
    
    public List<User> processUsers(List<User> users) {
        return users.stream()
            .filter(user -> user.isActive())
            .filter(user -> user.getAge() > 18)
            .map(user -> {
                user.setVerified(true);
                return user;
            })
            .sorted(Comparator.comparing(User::getName))
            .limit(10)
            .collect(Collectors.toList());
    }
    
    public Map<String, Long> countUsersByRole(List<User> users) {
        return users.stream()
            .collect(Collectors.groupingBy(
                User::getRole,
                Collectors.counting()
            ));
    }
    
    public Map<String, Double> averageAgeByRole(List<User> users) {
        return users.stream()
            .collect(Collectors.groupingBy(
                User::getRole,
                Collectors.averagingInt(User::getAge)
            ));
    }
    
    public List<User> getTopUsers(List<User> users, int count) {
        return users.stream()
            .sorted(Comparator.comparing(User::getScore).reversed())
            .limit(count)
            .collect(Collectors.toList());
    }
    
    public boolean anyUserActive(List<User> users) {
        return users.stream()
            .anyMatch(User::isActive);
    }
    
    public boolean allUsersVerified(List<User> users) {
        return users.stream()
            .allMatch(User::isVerified);
    }
    
    public Optional<User> findOldestUser(List<User> users) {
        return users.stream()
            .max(Comparator.comparing(User::getAge));
    }
}

/**
 * Stream operations with flatMap
 */
public class OrderService {
    private List<Order> orders;
    
    public List<Product> getAllProducts() {
        return orders.stream()
            .flatMap(order -> order.getProducts().stream())
            .distinct()
            .collect(Collectors.toList());
    }
    
    public long getTotalProductCount() {
        return orders.stream()
            .flatMap(order -> order.getProducts().stream())
            .count();
    }
    
    public double getTotalRevenue() {
        return orders.stream()
            .flatMap(order -> order.getProducts().stream())
            .mapToDouble(Product::getPrice)
            .sum();
    }
    
    public Map<String, List<Product>> groupProductsByCategory() {
        return orders.stream()
            .flatMap(order -> order.getProducts().stream())
            .collect(Collectors.groupingBy(Product::getCategory));
    }
}

/**
 * Parallel stream operations
 */
public class ParallelProcessor {
    
    public List<User> processUsersParallel(List<User> users) {
        return users.parallelStream()
            .filter(user -> user.isActive())
            .map(this::processUser)
            .collect(Collectors.toList());
    }
    
    private User processUser(User user) {
        // Expensive operation
        user.setProcessed(true);
        return user;
    }
    
    public long countParallel(List<User> users) {
        return users.parallelStream()
            .filter(User::isActive)
            .count();
    }
}

/**
 * Stream creation and operations
 */
public class StreamGenerator {
    
    public List<Integer> generateNumbers(int count) {
        return IntStream.range(0, count)
            .boxed()
            .collect(Collectors.toList());
    }
    
    public List<User> createUsers(int count) {
        return Stream.generate(() -> new User("User", "user@example.com"))
            .limit(count)
            .collect(Collectors.toList());
    }
    
    public List<Integer> fibonacci(int count) {
        return Stream.iterate(new int[]{0, 1}, arr -> new int[]{arr[1], arr[0] + arr[1]})
            .limit(count)
            .map(arr -> arr[0])
            .collect(Collectors.toList());
    }
}

/**
 * Stream reduction operations
 */
public class Aggregator {
    
    public Optional<User> findUserWithMaxScore(List<User> users) {
        return users.stream()
            .reduce((u1, u2) -> u1.getScore() > u2.getScore() ? u1 : u2);
    }
    
    public int sumAges(List<User> users) {
        return users.stream()
            .map(User::getAge)
            .reduce(0, Integer::sum);
    }
    
    public String combineNames(List<User> users) {
        return users.stream()
            .map(User::getName)
            .reduce("", (acc, name) -> acc + name + " ");
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
    private boolean active;
    private boolean verified;
    private boolean processed;
    private double score;
    
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
    
    public String getName() {
        return name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public int getAge() {
        return age;
    }
    
    public String getRole() {
        return role;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public boolean isVerified() {
        return verified;
    }
    
    public void setVerified(boolean verified) {
        this.verified = verified;
    }
    
    public void setProcessed(boolean processed) {
        this.processed = processed;
    }
    
    public double getScore() {
        return score;
    }
}

public class Order {
    private List<Product> products;
    
    public List<Product> getProducts() {
        return products;
    }
}

public class Product {
    private String name;
    private String category;
    private double price;
    
    public String getCategory() {
        return category;
    }
    
    public double getPrice() {
        return price;
    }
}
