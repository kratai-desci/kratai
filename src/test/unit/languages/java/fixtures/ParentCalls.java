package com.example.inheritance;

/**
 * Base service with methods to override
 */
public class BaseService {
    protected String serviceName;
    protected boolean initialized;
    
    public BaseService(String serviceName) {
        this.serviceName = serviceName;
        this.initialized = false;
    }
    
    public void initialize() {
        this.initialized = true;
        log("Service initialized");
    }
    
    public void execute() {
        log("Executing base logic");
    }
    
    protected void log(String message) {
        System.out.println("[" + serviceName + "] " + message);
    }
    
    protected void validate() {
        if (!initialized) {
            throw new IllegalStateException("Service not initialized");
        }
    }
}

/**
 * Child service with super calls
 */
public class UserService extends BaseService {
    private UserRepository repository;
    
    public UserService(UserRepository repository) {
        super("UserService"); // Super constructor call
        this.repository = repository;
    }
    
    @Override
    public void initialize() {
        super.initialize(); // Super method call
        log("Loading user data");
        repository.connect();
    }
    
    @Override
    public void execute() {
        super.validate(); // Call protected parent method
        super.execute(); // Call parent execute
        log("Executing user service logic");
        processUsers();
    }
    
    private void processUsers() {
        super.log("Processing users"); // Super call in private method
        repository.loadAll();
    }
}

/**
 * Another child with different super calls
 */
public class AdminService extends BaseService {
    private AdminRepository repository;
    
    public AdminService() {
        super("AdminService");
    }
    
    @Override
    public void initialize() {
        super.initialize();
        log("Admin service specific initialization");
    }
    
    @Override
    public void execute() {
        validate(); // Inherited method (not super call)
        super.execute();
        performAdminTasks();
    }
    
    private void performAdminTasks() {
        super.log("Performing admin tasks");
    }
}

/**
 * Multi-level inheritance with super calls
 */
public class ExtendedUserService extends UserService {
    private NotificationService notificationService;
    
    public ExtendedUserService(UserRepository repository, NotificationService notificationService) {
        super(repository); // Super constructor
        this.notificationService = notificationService;
    }
    
    @Override
    public void initialize() {
        super.initialize(); // Calls UserService.initialize which calls BaseService.initialize
        log("Extended service initialization");
    }
    
    @Override
    public void execute() {
        super.execute(); // Calls UserService.execute
        log("Extended execution logic");
        notificationService.sendNotifications();
    }
}

/**
 * Constructor chaining with super
 */
public class ConfigurableService extends BaseService {
    private Config config;
    
    public ConfigurableService() {
        this("DefaultService"); // this() constructor call
    }
    
    public ConfigurableService(String name) {
        super(name); // super() constructor call
        this.config = new Config();
    }
    
    public ConfigurableService(String name, Config config) {
        super(name);
        this.config = config;
    }
    
    @Override
    public void initialize() {
        super.initialize();
        config.load();
        super.log("Configuration loaded");
    }
}

/**
 * Override with super call in toString
 */
public class DetailedService extends BaseService {
    private String description;
    
    public DetailedService(String name, String description) {
        super(name);
        this.description = description;
    }
    
    @Override
    public String toString() {
        return super.toString() + " - " + description;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (!super.equals(obj)) {
            return false;
        }
        if (!(obj instanceof DetailedService)) {
            return false;
        }
        DetailedService other = (DetailedService) obj;
        return this.description.equals(other.description);
    }
}

/**
 * Supporting classes
 */
public class UserRepository {
    public void connect() {}
    public void loadAll() {}
}

public class AdminRepository {
    public void connect() {}
}

public class NotificationService {
    public void sendNotifications() {}
}

public class Config {
    public void load() {}
}

/**
 * Test super() constructor calls  
 */
public class ConstructorTest extends BaseService {
    private String value;
    
    public ConstructorTest(String name) {
        super(name); // Super constructor call
        this.value = "";
    }
    
    @Override
    public void execute() {
        log("Constructor test execution");
    }
}
