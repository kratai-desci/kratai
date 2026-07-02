package com.example.controller;

import com.example.service.UserService;
import com.example.model.User;
import com.example.dto.UserDTO;
import com.example.base.BaseController;
import com.example.util.ValidationUtils;

/**
 * Test comprehensive cross-package relationships
 * - Extends BaseController (different package)
 * - Uses UserService (composition)
 * - Returns User (return type)
 * - Accepts UserDTO (parameter type)
 * - Calls ValidationUtils.validate() (static call)
 * - Calls super.logRequest() (super call)
 */
public class UserController extends BaseController {
    private UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @Override
    public void initialize() {
        super.logRequest("UserController initialized");
    }
    
    public User getUser(Long id) {
        return userService.findById(id);
    }
    
    public User createUser(UserDTO dto) {
        if (ValidationUtils.validate(dto.getName())) {
            return userService.create(dto);
        }
        return null;
    }
}
