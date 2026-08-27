<?php
/**
 * Higher-Order Functions Test Fixture
 * Tests functions that take functions as parameters (callbacks)
 * PHP uses callable type hint for function parameters
 */

namespace App\Utils;

// Higher-order function: takes function as parameter
function map(array $array, callable $callback): array {
    $result = [];
    foreach ($array as $item) {
        $result[] = $callback($item);
    }
    return $result;
}

// Higher-order function: takes predicate function
function filter(array $array, callable $predicate): array {
    $result = [];
    foreach ($array as $item) {
        if ($predicate($item)) {
            $result[] = $item;
        }
    }
    return $result;
}

// Higher-order function: returns function (closure)
function createMultiplier(int $factor): callable {
    return function($number) use ($factor) {
        return $number * $factor;
    };
}

// Higher-order function: returns function
function createGreeter(string $greeting): callable {
    return function($name) use ($greeting) {
        return "$greeting, $name!";
    };
}

// Function composition
function compose(callable $f, callable $g): callable {
    return function($x) use ($f, $g) {
        return $f($g($x));
    };
}

// Function that uses callbacks
function processUsers(array $users, callable $validator, callable $transformer): array {
    $filtered = filter($users, $validator);
    return map($filtered, $transformer);
}

// Currying (partial application)
function add(int $a): callable {
    return function($b) use ($a) {
        return $a + $b;
    };
}

// Class with higher-order methods
class DataProcessor {
    private array $data;
    
    public function __construct(array $data) {
        $this->data = $data;
    }
    
    // Method that takes function as parameter
    public function transform(callable $transformer): array {
        return array_map($transformer, $this->data);
    }
    
    // Method that takes function as parameter
    public function filterBy(callable $predicate): array {
        return array_filter($this->data, $predicate);
    }
    
    // Method that returns function
    public function createValidator(array $rules): callable {
        return function($item) use ($rules) {
            foreach ($rules as $rule) {
                if (!$rule($item)) {
                    return false;
                }
            }
            return true;
        };
    }
}

// Using PHP's built-in higher-order functions
function useBuiltins(array $numbers): array {
    $doubled = array_map(function($x) { return $x * 2; }, $numbers);
    $evens = array_filter($numbers, function($x) { return $x % 2 === 0; });
    return array_merge($doubled, $evens);
}

// Callback pattern
function fetchData(string $url, callable $callback) {
    // Simulated data fetch
    $data = ['result' => 'data'];
    $callback($data);
}
