"""
Decorator Test Fixture
Tests Python decorator patterns
"""

from typing import Optional


class UserService:
    """Class with various decorators"""
    
    def __init__(self):
        self._users = {}
    
    @property
    def user_count(self) -> int:
        """Property decorator example"""
        return len(self._users)
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Static method decorator example"""
        return '@' in email
    
    @classmethod
    def from_config(cls, config: dict) -> 'UserService':
        """Class method decorator example"""
        instance = cls()
        return instance
    
    def get_user(self, user_id: int) -> Optional[dict]:
        """Regular instance method"""
        return self._users.get(user_id)


# Custom decorator example (simulating FastAPI/Flask patterns)
def route(path: str):
    """Custom decorator factory"""
    def decorator(func):
        func._route = path
        return func
    return decorator


class APIController:
    """Class with custom decorators"""
    
    @route('/users')
    def list_users(self):
        """Method with custom decorator"""
        return []
    
    @route('/users/{id}')
    def get_user(self, user_id: int):
        """Method with custom decorator"""
        return {}


class CachedService:
    """Class with property getter/setter"""
    
    def __init__(self):
        self._cache = None
    
    @property
    def cache(self):
        """Getter"""
        return self._cache
    
    @cache.setter
    def cache(self, value):
        """Setter"""
        self._cache = value
    
    @cache.deleter
    def cache(self):
        """Deleter"""
        self._cache = None
