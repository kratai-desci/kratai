package com.example.invalid;

// This file has intentional syntax errors
// Parser should handle gracefully

public class InvalidSyntax {
    // Missing semicolon
    private String name
    
    // Unclosed brace
    public void method() {
        System.out.println("test"
    
    // Invalid syntax
    public int calculate(
    
    // Missing closing brace
