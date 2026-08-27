"""
Re-export Pattern Test Fixture
Tests module re-export patterns (from X import Y)
"""

# Re-export specific items from other modules
from .class_based import UserService, BaseService
from .functional import validate_user, create_user

# Re-export with alias
from .class_based import UserRepository as DefaultUserRepository

# Import and re-export all (not recommended but should be parsed)
# from .type_hints import *

# Named exports that will be re-exported
class ConfigService:
    def __init__(self):
        self.config = {}
    
    def get_config(self, key: str):
        return self.config.get(key)

def load_config(path: str) -> dict:
    """Load configuration from file"""
    return {"loaded": True}

# Re-export list (common Python pattern)
__all__ = [
    'UserService',
    'BaseService',
    'validate_user',
    'create_user',
    'DefaultUserRepository',
    'ConfigService',
    'load_config'
]

# This file should create import/re-export relationships
