<?php
/**
 * Re-export Pattern Test Fixture
 * PHP doesn't have traditional re-exports like ES6, but we can test
 * namespace forwarding and class aliasing patterns
 */

namespace App\Public;

// Class aliasing (similar to re-export)
use App\Internal\UserService as InternalUserService;
use App\Internal\BaseService;
use App\Utils\ValidationHelper;

// Create public-facing aliases
class UserService extends InternalUserService {
    // Re-export by extending (facade pattern)
}

class ValidationUtils extends ValidationHelper {
    // Re-export utility class
}

// Local class definitions
class ConfigService {
    private array $config = [];
    
    public function getConfig(string $key) {
        return $this->config[$key] ?? null;
    }
    
    public function setConfig(string $key, $value): void {
        $this->config[$key] = $value;
    }
}

function loadConfig(string $path): array {
    return ['loaded' => true, 'path' => $path];
}

// Namespace forwarding pattern (common in PHP frameworks)
namespace App\Facades;

class User {
    public static function find($id) {
        return (new \App\Services\UserService())->find($id);
    }
    
    public static function create(array $data) {
        return (new \App\Services\UserService())->create($data);
    }
}
