package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;
import com.example.service.UserService;

/**
 * MVC Controller - Returns HTML views (Thymeleaf/JSP)
 * Uses @Controller for traditional web pages
 * Tests REAL-WORLD Spring MVC patterns
 * 
 * MUST detect:
 * - @Controller annotation → classType = 'controller'
 * - Constructor injection (UserService)
 * - @RequestMapping at class level
 * - @GetMapping methods
 * - Pattern 1: Simple string return
 * - Pattern 2: ModelAndView variable
 * - Pattern 3: Inline ModelAndView
 */
@Controller
@RequestMapping("/users")
public class UserViewController {
    
    private final UserService userService;
    
    // MUST detect: Constructor injection
    public UserViewController(UserService userService) {
        this.userService = userService;
    }
    
    // PATTERN 1: Simple string return (original pattern)
    @GetMapping
    public String listUsers(Model model) {
        model.addAttribute("users", userService.findAll());
        return "users/list"; // Returns view name (Thymeleaf template)
    }
    
    // PATTERN 2: ModelAndView variable (most common real-world pattern)
    @GetMapping("/{id}")
    public ModelAndView viewUser(@PathVariable Long id) {
        ModelAndView mv = new ModelAndView("users/view");
        mv.addObject("user", userService.findById(id));
        return mv;
    }
    
    // PATTERN 3: Inline ModelAndView (also common)
    @GetMapping("/new")
    public ModelAndView newUserForm() {
        return new ModelAndView("users/form");
    }
}
