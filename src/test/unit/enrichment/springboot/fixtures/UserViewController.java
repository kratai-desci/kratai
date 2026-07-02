package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import com.example.service.UserService;

/**
 * MVC Controller - Returns HTML views (Thymeleaf/JSP)
 * Uses @Controller for traditional web pages
 * 
 * MUST detect:
 * - @Controller annotation → classType = 'controller'
 * - Constructor injection (UserService)
 * - @RequestMapping at class level
 * - @GetMapping methods
 * - Returns view names (String), not ResponseEntity
 */
@Controller
@RequestMapping("/users")
public class UserViewController {
    
    private final UserService userService;
    
    // MUST detect: Constructor injection
    public UserViewController(UserService userService) {
        this.userService = userService;
    }
    
    // MUST detect: GET /users (list view)
    @GetMapping
    public String listUsers(Model model) {
        model.addAttribute("users", userService.findAll());
        return "users/list"; // Returns view name (Thymeleaf template)
    }
    
    // MUST detect: GET /users/:id (detail view)
    @GetMapping("/{id}")
    public String viewUser(@PathVariable Long id, Model model) {
        model.addAttribute("user", userService.findById(id));
        return "users/view"; // Returns view name
    }
    
    // MUST detect: GET /users/new (create form)
    @GetMapping("/new")
    public String newUserForm(Model model) {
        return "users/form";
    }
}
