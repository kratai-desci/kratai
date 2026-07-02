package com.example.inner;

/**
 * Outer class with inner classes
 */
public class OuterClass {
    private String outerField;
    
    public OuterClass(String outerField) {
        this.outerField = outerField;
    }
    
    /**
     * Non-static inner class
     */
    public class InnerClass {
        private String innerField;
        
        public InnerClass(String innerField) {
            this.innerField = innerField;
        }
        
        public void display() {
            // Can access outer class fields
            System.out.println("Outer: " + outerField);
            System.out.println("Inner: " + innerField);
        }
        
        public String getOuterField() {
            return outerField;
        }
    }
    
    /**
     * Static nested class
     */
    public static class StaticNestedClass {
        private String nestedField;
        
        public StaticNestedClass(String nestedField) {
            this.nestedField = nestedField;
        }
        
        public void display() {
            // Cannot access outer instance fields directly
            System.out.println("Nested: " + nestedField);
        }
    }
    
    /**
     * Method with local inner class
     */
    public void methodWithLocalClass() {
        final String localVar = "Local";
        
        class LocalInnerClass {
            public void display() {
                System.out.println("Outer: " + outerField);
                System.out.println("Local: " + localVar);
            }
        }
        
        LocalInnerClass local = new LocalInnerClass();
        local.display();
    }
    
    /**
     * Method with anonymous inner class
     */
    public Runnable createRunnable() {
        return new Runnable() {
            @Override
            public void run() {
                System.out.println("Anonymous class: " + outerField);
            }
        };
    }
}

/**
 * Service using inner classes
 */
public class UserService {
    private String serviceName;
    
    public UserService(String serviceName) {
        this.serviceName = serviceName;
    }
    
    /**
     * Inner validator class
     */
    public class UserValidator {
        public boolean validate(User user) {
            System.out.println("Validating in: " + serviceName);
            return user.getName() != null && user.getEmail() != null;
        }
    }
    
    /**
     * Static nested builder
     */
    public static class UserBuilder {
        private String name;
        private String email;
        
        public UserBuilder setName(String name) {
            this.name = name;
            return this;
        }
        
        public UserBuilder setEmail(String email) {
            this.email = email;
            return this;
        }
        
        public User build() {
            return new User(name, email);
        }
    }
    
    public User createUser(String name, String email) {
        UserValidator validator = new UserValidator();
        User user = new User(name, email);
        
        if (validator.validate(user)) {
            return user;
        }
        throw new IllegalArgumentException("Invalid user");
    }
    
    public User createUserWithBuilder(String name, String email) {
        return new UserBuilder()
            .setName(name)
            .setEmail(email)
            .build();
    }
}

/**
 * Repository with inner classes for queries
 */
public class UserRepository {
    
    public static class QueryBuilder {
        private String table;
        private String whereClause;
        
        public QueryBuilder from(String table) {
            this.table = table;
            return this;
        }
        
        public QueryBuilder where(String condition) {
            this.whereClause = condition;
            return this;
        }
        
        public String build() {
            return "SELECT * FROM " + table + " WHERE " + whereClause;
        }
    }
    
    public class ResultMapper {
        public User mapRow(ResultSet rs) {
            // Map database row to User object
            return new User(rs.getString("name"), rs.getString("email"));
        }
    }
    
    public List<User> findUsers(String condition) {
        String query = new QueryBuilder()
            .from("users")
            .where(condition)
            .build();
        
        ResultMapper mapper = new ResultMapper();
        // Execute query and map results
        return null;
    }
}

/**
 * Configuration class with nested configs
 */
public class ApplicationConfig {
    
    public static class DatabaseConfig {
        private String url;
        private String username;
        private String password;
        
        public DatabaseConfig(String url, String username, String password) {
            this.url = url;
            this.username = username;
            this.password = password;
        }
        
        public String getUrl() {
            return url;
        }
    }
    
    public static class CacheConfig {
        private int maxSize;
        private int ttl;
        
        public CacheConfig(int maxSize, int ttl) {
            this.maxSize = maxSize;
            this.ttl = ttl;
        }
        
        public int getMaxSize() {
            return maxSize;
        }
    }
    
    private DatabaseConfig databaseConfig;
    private CacheConfig cacheConfig;
    
    public void configure() {
        databaseConfig = new DatabaseConfig("jdbc:postgresql://localhost/db", "user", "pass");
        cacheConfig = new CacheConfig(1000, 3600);
    }
}

/**
 * Supporting classes
 */
public class User {
    private String name;
    private String email;
    
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
}

public class ResultSet {
    public String getString(String column) {
        return "";
    }
}
