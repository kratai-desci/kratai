package com.example.enums;

/**
 * Simple enum with values
 */
public enum Status {
    ACTIVE,
    INACTIVE,
    PENDING,
    DELETED
}

/**
 * Enum with fields and methods
 */
public enum UserRole {
    ADMIN("Administrator", 100),
    MODERATOR("Moderator", 50),
    USER("Regular User", 10),
    GUEST("Guest", 1);
    
    private final String displayName;
    private final int priority;
    
    UserRole(String displayName, int priority) {
        this.displayName = displayName;
        this.priority = priority;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public int getPriority() {
        return priority;
    }
    
    public boolean hasHigherPriorityThan(UserRole other) {
        return this.priority > other.priority;
    }
}

/**
 * Enum with abstract methods
 */
public enum Operation {
    ADD {
        @Override
        public double apply(double x, double y) {
            return x + y;
        }
    },
    SUBTRACT {
        @Override
        public double apply(double x, double y) {
            return x - y;
        }
    },
    MULTIPLY {
        @Override
        public double apply(double x, double y) {
            return x * y;
        }
    },
    DIVIDE {
        @Override
        public double apply(double x, double y) {
            if (y == 0) {
                throw new ArithmeticException("Division by zero");
            }
            return x / y;
        }
    };
    
    public abstract double apply(double x, double y);
}

/**
 * Enum for HTTP status codes
 */
public enum HttpStatus {
    OK(200, "OK"),
    CREATED(201, "Created"),
    BAD_REQUEST(400, "Bad Request"),
    UNAUTHORIZED(401, "Unauthorized"),
    NOT_FOUND(404, "Not Found"),
    INTERNAL_SERVER_ERROR(500, "Internal Server Error");
    
    private final int code;
    private final String message;
    
    HttpStatus(int code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public int getCode() {
        return code;
    }
    
    public String getMessage() {
        return message;
    }
    
    public boolean isSuccess() {
        return code >= 200 && code < 300;
    }
    
    public boolean isError() {
        return code >= 400;
    }
    
    public static HttpStatus fromCode(int code) {
        for (HttpStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown status code: " + code);
    }
}

/**
 * Service using enums
 */
public class UserService {
    public User createUser(String name, UserRole role) {
        User user = new User();
        user.setName(name);
        user.setRole(role);
        user.setStatus(Status.PENDING);
        return user;
    }
    
    public boolean canModerate(User user) {
        return user.getRole().hasHigherPriorityThan(UserRole.USER);
    }
    
    public void activateUser(User user) {
        if (user.getStatus() == Status.PENDING) {
            user.setStatus(Status.ACTIVE);
        }
    }
}

/**
 * Calculator using operation enum
 */
public class Calculator {
    public double calculate(double x, double y, Operation operation) {
        return operation.apply(x, y);
    }
    
    public double add(double x, double y) {
        return Operation.ADD.apply(x, y);
    }
    
    public double subtract(double x, double y) {
        return Operation.SUBTRACT.apply(x, y);
    }
}

/**
 * HTTP response using status enum
 */
public class HttpResponse {
    private HttpStatus status;
    private String body;
    
    public HttpResponse(HttpStatus status, String body) {
        this.status = status;
        this.body = body;
    }
    
    public boolean isSuccessful() {
        return status.isSuccess();
    }
    
    public int getStatusCode() {
        return status.getCode();
    }
}

/**
 * User class
 */
public class User {
    private String name;
    private UserRole role;
    private Status status;
    
    public void setName(String name) {
        this.name = name;
    }
    
    public void setRole(UserRole role) {
        this.role = role;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public UserRole getRole() {
        return role;
    }
    
    public Status getStatus() {
        return status;
    }
}
