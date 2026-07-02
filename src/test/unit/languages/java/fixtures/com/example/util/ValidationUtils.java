package com.example.util;

/**
 * Pure Java - Utility class in separate package (for static call testing)
 */
public class ValidationUtils {
    public static boolean validate(String input) {
        return input != null && !input.isEmpty();
    }
    
    public static String sanitize(String input) {
        return input.trim();
    }
}
