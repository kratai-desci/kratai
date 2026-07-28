"""
Factory Pattern Test Fixture
Tests factory functions that create instances (ClassName())
"""

from typing import List, Optional
from datetime import datetime


class User:
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email
        self.created_at = datetime.now()
    
    def is_valid(self) -> bool:
        return bool(self.name and self.email)


class Product:
    def __init__(self, title: str, price: float):
        self.title = title
        self.price = price


class Order:
    def __init__(self, user_id: int, items: List[Product]):
        self.user_id = user_id
        self.items = items
        self.total = 0.0


# Factory function that creates User instances
def create_user(name: str, email: str) -> User:
    """
    MUST detect: create_user creates User (User())
    Factory → Product relationship
    """
    return User(name, email)


# Factory function that creates Product instances
def create_product(title: str, price: float) -> Product:
    """
    MUST detect: create_product creates Product (Product())
    Factory → Product relationship
    """
    return Product(title, price)


# Factory with validation
def create_validated_user(data: dict) -> User:
    """Factory with validation logic"""
    if not data.get('name') or not data.get('email'):
        raise ValueError('Invalid user data')
    # MUST detect: factory creates User
    return User(data['name'], data['email'])


# Factory that creates multiple instances
def create_order(user_id: int, product_data: List[dict]) -> Order:
    """
    MUST detect: create_order creates Order and Product
    Multiple factory relationships
    """
    items = [Product(data['title'], data['price']) for data in product_data]
    return Order(user_id, items)


# Builder pattern (factory-like)
class UserBuilder:
    def __init__(self):
        self.user_data = {}
    
    def with_name(self, name: str) -> 'UserBuilder':
        self.user_data['name'] = name
        return self
    
    def with_email(self, email: str) -> 'UserBuilder':
        self.user_data['email'] = email
        return self
    
    def build(self) -> User:
        """
        MUST detect: build creates User
        Builder pattern factory
        """
        return User(self.user_data['name'], self.user_data['email'])


# Factory with conditional creation
def create_user_from_type(user_type: str, data: dict) -> User:
    """Factory with conditional logic"""
    if user_type == 'admin':
        # Even with conditions, should detect User creation
        return User(data['name'], data['email'])
    else:
        return User(data['name'], data['email'])


# Abstract factory pattern
class UserFactory:
    @staticmethod
    def create_standard_user(name: str, email: str) -> User:
        """MUST detect: static method creates User"""
        return User(name, email)
    
    @classmethod
    def create_from_dict(cls, data: dict) -> User:
        """MUST detect: class method creates User"""
        return User(data['name'], data['email'])
