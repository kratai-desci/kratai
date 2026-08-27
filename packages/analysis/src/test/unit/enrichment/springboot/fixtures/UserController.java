package com.example.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import com.example.service.UserService;
import com.example.dto.UserDTO;
import java.util.List;

/**
 * REST Controller with Full CRUD Operations
 * 
 * MUST detect:
 * - @RestController annotation
 * - @RequestMapping("/api/users") - Base path at class level
 * - @GetMapping, @PostMapping, @PutMapping, @DeleteMapping
 * - Path variables (@PathVariable)
 * - Request body (@RequestBody)
 * - Query parameters (@RequestParam)
 * - Constructor injection (UserService)
 * - Route nodes: GET /api/users, POST /api/users, GET /api/users/:id, etc.
 * - Controller -> Service relationship (injects)
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    // MUST detect: Constructor injection (recommended pattern)
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    // MUST detect: GET /api/users (list endpoint)
    // MUST detect: @RequestParam for query parameters
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page) {
        List<UserDTO> users = userService.findAll(name, page);
        return ResponseEntity.ok(users);
    }
    
    // MUST detect: GET /api/users/:id (detail endpoint)
    // MUST detect: @PathVariable for URL parameter
    // MUST detect: Calls userService.findById()
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        UserDTO user = userService.findById(id);
        return ResponseEntity.ok(user);
    }
    
    // MUST detect: POST /api/users (create endpoint)
    // MUST detect: @RequestBody for POST payload
    // MUST detect: Returns 201 CREATED status
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO dto) {
        UserDTO created = userService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    // MUST detect: PUT /api/users/:id (update endpoint)
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UserDTO dto) {
        UserDTO updated = userService.update(id, dto);
        return ResponseEntity.ok(updated);
    }
    
    // MUST detect: DELETE /api/users/:id (delete endpoint)
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    // MUST detect: PATCH /api/users/:id (partial update)
    @PatchMapping("/{id}")
    public ResponseEntity<UserDTO> patchUser(
            @PathVariable Long id,
            @RequestBody UserDTO dto) {
        UserDTO patched = userService.patch(id, dto);
        return ResponseEntity.ok(patched);
    }
    
    // MUST detect: GET /api/users/:id/posts (nested resource)
    @GetMapping("/{id}/posts")
    public ResponseEntity<List<PostDTO>> getUserPosts(@PathVariable Long id) {
        List<PostDTO> posts = userService.getUserPosts(id);
        return ResponseEntity.ok(posts);
    }
}
