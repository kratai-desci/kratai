"""
Higher-Order Functions Test Fixture
Tests functions that take functions as parameters or return functions
"""

from typing import Callable, List, TypeVar, Any

T = TypeVar('T')
U = TypeVar('U')


# Higher-order function: takes function as parameter
def map_list(array: List[T], callback: Callable[[T], U]) -> List[U]:
    """
    MUST detect: function takes function as parameter
    callback parameter type is Callable
    """
    result = []
    for item in array:
        result.append(callback(item))
    return result


# Higher-order function: takes function as parameter
def filter_list(array: List[T], predicate: Callable[[T], bool]) -> List[T]:
    """
    MUST detect: predicate parameter is function type
    """
    result = []
    for item in array:
        if predicate(item):
            result.append(item)
    return result


# Higher-order function: returns function
def create_multiplier(factor: int) -> Callable[[int], int]:
    """
    MUST detect: returns function (Callable return type)
    """
    def multiplier(number: int) -> int:
        return number * factor
    return multiplier


# Higher-order function: returns function
def create_greeter(greeting: str) -> Callable[[str], str]:
    """
    MUST detect: returns Callable
    """
    def greet(name: str) -> str:
        return f"{greeting}, {name}!"
    return greet


# Function composition
def compose(f: Callable, g: Callable) -> Callable:
    """
    MUST detect: takes two functions, returns function
    """
    def composed(x):
        return f(g(x))
    return composed


# Decorator as higher-order function
def timing_decorator(func: Callable) -> Callable:
    """
    MUST detect: decorator takes function, returns function
    """
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result
    return wrapper


# Function that uses callbacks
def process_users(users: List[dict], 
                 validator: Callable[[dict], bool],
                 transformer: Callable[[dict], dict]) -> List[dict]:
    """
    MUST detect: multiple function parameters
    """
    filtered = [u for u in users if validator(u)]
    return [transformer(u) for u in filtered]


# Currying
def add(a: int) -> Callable[[int], int]:
    """
    MUST detect: returns function (currying pattern)
    """
    def add_b(b: int) -> int:
        return a + b
    return add_b


# Partial application
def partial(func: Callable, *args) -> Callable:
    """
    MUST detect: takes function, returns function
    """
    def partial_func(*more_args):
        return func(*args, *more_args)
    return partial_func


# Class with higher-order methods
class DataProcessor:
    def __init__(self, data: List[Any]):
        self.data = data
    
    # Method that takes function as parameter
    def transform(self, transformer: Callable[[Any], Any]) -> List[Any]:
        """
        MUST detect: method takes function parameter
        """
        return [transformer(item) for item in self.data]
    
    # Method that takes function as parameter
    def filter_by(self, predicate: Callable[[Any], bool]) -> List[Any]:
        """
        MUST detect: method takes function parameter
        """
        return [item for item in self.data if predicate(item)]
    
    # Method that returns function
    def create_validator(self, rules: List[Callable]) -> Callable[[Any], bool]:
        """
        MUST detect: method returns function
        """
        def validator(item: Any) -> bool:
            return all(rule(item) for rule in rules)
        return validator


# Lambda as higher-order function
apply_twice = lambda f, x: f(f(x))


# Map, filter, reduce with lambdas (built-in higher-order functions)
def use_builtins(numbers: List[int]) -> List[int]:
    """Using Python's built-in higher-order functions"""
    doubled = list(map(lambda x: x * 2, numbers))
    evens = list(filter(lambda x: x % 2 == 0, numbers))
    return doubled + evens


# Callback pattern
def fetch_data(url: str, callback: Callable[[dict], None]) -> None:
    """
    MUST detect: callback parameter type
    """
    # Simulated async operation
    data = {"result": "data"}
    callback(data)
