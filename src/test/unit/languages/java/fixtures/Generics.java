package com.example.generics;

import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

/**
 * Generic repository interface
 */
public interface Repository<T, ID> {
    T findById(ID id);
    List<T> findAll();
    T save(T entity);
    void delete(ID id);
}

/**
 * Generic base repository implementation
 */
public abstract class BaseRepository<T, ID> implements Repository<T, ID> {
    protected List<T> storage = new ArrayList<>();
    
    @Override
    public List<T> findAll() {
        return new ArrayList<>(storage);
    }
    
    @Override
    public T save(T entity) {
        storage.add(entity);
        return entity;
    }
    
    public Optional<T> findOptional(ID id) {
        return Optional.ofNullable(findById(id));
    }
}

/**
 * Concrete user repository with generics
 */
public class UserRepository extends BaseRepository<User, Long> {
    @Override
    public User findById(Long id) {
        return storage.stream()
            .filter(u -> u.getId().equals(id))
            .findFirst()
            .orElse(null);
    }
    
    @Override
    public void delete(Long id) {
        storage.removeIf(u -> u.getId().equals(id));
    }
    
    public List<User> findByName(String name) {
        List<User> results = new ArrayList<>();
        for (User user : storage) {
            if (user.getName().equals(name)) {
                results.add(user);
            }
        }
        return results;
    }
}

/**
 * Service using generic repository
 */
public class UserService {
    private Repository<User, Long> repository;
    
    public UserService(Repository<User, Long> repository) {
        this.repository = repository;
    }
    
    public List<User> getAllUsers() {
        return repository.findAll();
    }
    
    public User getUser(Long id) {
        return repository.findById(id);
    }
    
    public User createUser(User user) {
        return repository.save(user);
    }
}

/**
 * Generic service for any entity
 */
public class GenericService<T, ID> {
    private Repository<T, ID> repository;
    
    public GenericService(Repository<T, ID> repository) {
        this.repository = repository;
    }
    
    public T get(ID id) {
        return repository.findById(id);
    }
    
    public List<T> getAll() {
        return repository.findAll();
    }
    
    public T create(T entity) {
        return repository.save(entity);
    }
}

/**
 * Bounded generic with extends
 */
public class NumberRepository<T extends Number> {
    private List<T> numbers = new ArrayList<>();
    
    public void add(T number) {
        numbers.add(number);
    }
    
    public T getMax() {
        T max = null;
        for (T number : numbers) {
            if (max == null || number.doubleValue() > max.doubleValue()) {
                max = number;
            }
        }
        return max;
    }
}

/**
 * Multiple generic type parameters
 */
public class Pair<K, V> {
    private K key;
    private V value;
    
    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }
    
    public K getKey() {
        return key;
    }
    
    public V getValue() {
        return value;
    }
}

/**
 * Generic method examples
 */
public class GenericMethods {
    public <T> List<T> toList(T... items) {
        List<T> list = new ArrayList<>();
        for (T item : items) {
            list.add(item);
        }
        return list;
    }
    
    public <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) > 0 ? a : b;
    }
    
    public <K, V> Pair<K, V> makePair(K key, V value) {
        return new Pair<>(key, value);
    }
}

/**
 * User class for testing
 */
public class User {
    private Long id;
    private String name;
    
    public User(Long id, String name) {
        this.id = id;
        this.name = name;
    }
    
    public Long getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
}
