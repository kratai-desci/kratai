package com.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.entity.User;
import java.util.List;
import java.util.Optional;

/**
 * JPA Repository Interface
 * 
 * MUST detect:
 * - @Repository annotation
 * - extends JpaRepository<User, Long> - Generic repository
 * - Entity type extraction: User (from JpaRepository<User, Long>)
 * - ID type extraction: Long
 * - Custom query methods (findBy naming convention)
 * - @Query annotation with JPQL
 * - @Param for named parameters
 * - Repository -> Entity relationship (manages)
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // MUST detect: Custom query method by naming convention
    // Derived query: findBy + Email
    Optional<User> findByEmail(String email);
    
    // MUST detect: Complex derived query
    // findBy + Email + And + Active + True
    List<User> findByEmailAndActiveTrue(String email);
    
    // MUST detect: Multiple conditions
    List<User> findByNameContainingAndAgeLessThan(String name, int age);
    
    // MUST detect: @Query with JPQL
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
    Optional<User> findActiveUserByEmail(@Param("email") String email);
    
    // MUST detect: Native SQL query
    @Query(value = "SELECT * FROM users WHERE email = ?1", nativeQuery = true)
    Optional<User> findByEmailNative(String email);
    
    // MUST detect: @Query with JOIN
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.posts WHERE u.id = :id")
    Optional<User> findUserWithPosts(@Param("id") Long id);
    
    // MUST detect: Count query
    Long countByActiveTrue();
    
    // MUST detect: Delete query
    void deleteByEmail(String email);
    
    // MUST detect: Exists query
    boolean existsByEmail(String email);
}
