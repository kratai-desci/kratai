package com.example.base;

/**
 * Base controller in separate package - for inheritance testing
 */
public abstract class BaseController {
    protected String version = "1.0";
    
    public abstract void initialize();
    
    protected void logRequest(String message) {
        System.out.println(message);
    }
}
