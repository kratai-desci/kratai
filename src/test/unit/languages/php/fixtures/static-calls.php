<?php
/**
 * Static Method Calls Test Fixture
 * Tests Class::staticMethod() patterns
 */

namespace App\Utils;

class ValidationUtils {
    public static function validateEmail(string $email): bool {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    public static function validatePassword(string $password): bool {
        return strlen($password) >= 8;
    }
    
    public static function sanitize(string $input): string {
        return htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    }
}

class StringUtils {
    public static function slugify(string $text): string {
        return strtolower(preg_replace('/[^A-Za-z0-9-]+/', '-', $text));
    }
    
    public static function truncate(string $text, int $length): string {
        return substr($text, 0, $length);
    }
}

class UserService {
    public function createUser(array $data) {
        // Static method calls to ValidationUtils
        if (!ValidationUtils::validateEmail($data['email'])) {
            return null;
        }
        
        if (!ValidationUtils::validatePassword($data['password'])) {
            return null;
        }
        
        $data['email'] = ValidationUtils::sanitize($data['email']);
        return $data;
    }
}

class NameFormatter {
    public function format(string $name): string {
        // Static call to StringUtils
        return StringUtils::slugify($name);
    }
}
