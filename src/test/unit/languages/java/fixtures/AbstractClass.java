package com.example.abstract;

import java.util.List;

/**
 * Abstract base service with template method pattern
 */
public abstract class AbstractBaseService {
    protected String serviceName;
    protected boolean initialized;
    
    public AbstractBaseService(String serviceName) {
        this.serviceName = serviceName;
        this.initialized = false;
    }
    
    // Abstract methods that must be implemented
    public abstract void initialize();
    public abstract void cleanup();
    
    // Template method
    public final void execute() {
        if (!initialized) {
            initialize();
        }
        doExecute();
        cleanup();
    }
    
    // Hook method
    protected void doExecute() {
        System.out.println("Executing " + serviceName);
    }
    
    protected void log(String message) {
        System.out.println("[" + serviceName + "] " + message);
    }
}

/**
 * Concrete implementation of abstract service
 */
public class ConcreteService extends AbstractBaseService {
    private DatabaseConnection connection;
    
    public ConcreteService() {
        super("ConcreteService");
    }
    
    @Override
    public void initialize() {
        log("Initializing service");
        this.initialized = true;
    }
    
    @Override
    public void cleanup() {
        log("Cleaning up service");
        if (connection != null) {
            connection.close();
        }
    }
    
    @Override
    protected void doExecute() {
        super.doExecute();
        log("Custom execution logic");
    }
}

/**
 * Abstract repository with CRUD operations
 */
public abstract class AbstractRepository<T, ID> {
    protected abstract T findById(ID id);
    protected abstract List<T> findAll();
    protected abstract T save(T entity);
    protected abstract void delete(ID id);
    
    public boolean exists(ID id) {
        return findById(id) != null;
    }
    
    public long count() {
        return findAll().size();
    }
}

/**
 * Concrete user repository
 */
public class UserRepository extends AbstractRepository<User, Long> {
    private DatabaseConnection connection;
    
    @Override
    protected User findById(Long id) {
        return connection.query("SELECT * FROM users WHERE id = ?", id);
    }
    
    @Override
    protected List<User> findAll() {
        return connection.query("SELECT * FROM users");
    }
    
    @Override
    protected User save(User entity) {
        return connection.insert(entity);
    }
    
    @Override
    protected void delete(Long id) {
        connection.execute("DELETE FROM users WHERE id = ?", id);
    }
}
