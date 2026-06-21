/**
 * Higher-Order Functions Test Fixture
 * Tests functions that take functions as parameters or return functions
 */

// Higher-order function: takes function as parameter
function map(array, callback) {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        result.push(callback(array[i], i));
    }
    return result;
}

// Higher-order function: takes function as parameter
function filter(array, predicate) {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i], i)) {
            result.push(array[i]);
        }
    }
    return result;
}

// Higher-order function: returns function
function createMultiplier(factor) {
    return function(number) {
        return number * factor;
    };
}

// Higher-order function: returns function
function createGreeter(greeting) {
    return function(name) {
        return `${greeting}, ${name}!`;
    };
}

// Function composition
function compose(f, g) {
    return function(x) {
        return f(g(x));
    };
}

// Callback-based async pattern
function fetchData(url, callback) {
    // Simulated async operation
    setTimeout(() => {
        callback(null, { data: 'result' });
    }, 100);
}

// Function that uses callbacks
function processUsers(users, validator, transformer) {
    return users
        .filter(validator)
        .map(transformer);
}

// Currying
function add(a) {
    return function(b) {
        return a + b;
    };
}

// Class with higher-order methods
class DataProcessor {
    constructor(data) {
        this.data = data;
    }
    
    // Method that takes function as parameter
    transform(transformer) {
        return this.data.map(transformer);
    }
    
    // Method that takes function as parameter
    filterBy(predicate) {
        return this.data.filter(predicate);
    }
    
    // Method that returns function
    createValidator(rules) {
        return (item) => {
            return rules.every(rule => rule(item));
        };
    }
}

// Usage examples with callbacks
const numbers = [1, 2, 3, 4, 5];

// Using higher-order functions with arrow function callbacks
const doubled = map(numbers, n => n * 2);
const evens = filter(numbers, n => n % 2 === 0);

// Using composition
const addOne = x => x + 1;
const double = x => x * 2;
const addOneThenDouble = compose(double, addOne);

module.exports = {
    map,
    filter,
    createMultiplier,
    createGreeter,
    compose,
    fetchData,
    processUsers,
    add,
    DataProcessor
};
