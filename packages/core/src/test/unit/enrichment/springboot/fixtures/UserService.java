package com.example.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.repository.UserRepository;
import com.example.entity.User;
import com.example.dto.UserDTO;
import java.util.List;

/**
 * Service Layer with Business Logic
 * 
 * MUST detect:
 * - @Service annotation
 * - @Transactional methods (transaction boundaries)
 * - Constructor injection (UserRepository)
 * - Service -> Repository relationship (injects)
 * - Method calls to repository
 * - DTO transformations (Entity -> DTO)
 */
@Service
public class UserService {
    
    private final UserRepository userRepository;
    
    // MUST detect: Constructor injection
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    // MUST detect: Read-only transaction
    @Transactional(readOnly = true)
    public List<UserDTO> findAll(String name, int page) {
        // MUST detect: Calls userRepository.findAll()
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::toDTO)
                .toList();
    }
    
    // MUST detect: Read-only transaction
    @Transactional(readOnly = true)
    public UserDTO findById(Long id) {
        // MUST detect: Calls userRepository.findById()
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return toDTO(user);
    }
    
    // MUST detect: Write transaction (default)
    @Transactional
    public UserDTO create(UserDTO dto) {
        User user = toEntity(dto);
        // MUST detect: Calls userRepository.save()
        User saved = userRepository.save(user);
        return toDTO(saved);
    }
    
    // MUST detect: Write transaction
    @Transactional
    public UserDTO update(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        
        User updated = userRepository.save(user);
        return toDTO(updated);
    }
    
    // MUST detect: Write transaction with delete operation
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        // MUST detect: Calls userRepository.deleteById()
        userRepository.deleteById(id);
    }
    
    @Transactional
    public UserDTO patch(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
        if (dto.getName() != null) {
            user.setName(dto.getName());
        }
        if (dto.getEmail() != null) {
            user.setEmail(dto.getEmail());
        }
        
        User patched = userRepository.save(user);
        return toDTO(patched);
    }
    
    @Transactional(readOnly = true)
    public List<PostDTO> getUserPosts(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
        // MUST detect: Access to @OneToMany relationship
        return user.getPosts().stream()
                .map(post -> new PostDTO(post.getId(), post.getTitle()))
                .toList();
    }
    
    // MUST detect: DTO transformation (Entity -> DTO)
    private UserDTO toDTO(User user) {
        return new UserDTO(user.getId(), user.getName(), user.getEmail());
    }
    
    // MUST detect: DTO transformation (DTO -> Entity)
    private User toEntity(UserDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        return user;
    }
}
