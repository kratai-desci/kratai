# Basic OOP patterns with classes and inheritance

class BaseService:
    """Base service class"""
    
    def __init__(self):
        self.is_active = True
    
    def validate(self, data):
        """Validate data"""
        return True
    
    def process(self):
        """Process data"""
        pass


class UserService(BaseService):
    """User service that extends BaseService"""
    
    def __init__(self, repository):
        super().__init__()
        self.repository = repository
        self._cache = {}
    
    def get_user(self, user_id: str):
        """Get user by ID"""
        return self.repository.find(user_id)
    
    def create_user(self, data: dict):
        """Create a new user"""
        if self.validate(data):
            return self.repository.save(data)
        return None


class UserRepository:
    """Repository for user data"""
    
    def __init__(self):
        self.users = []
    
    def find(self, user_id: str):
        """Find user by ID"""
        return next((u for u in self.users if u.id == user_id), None)
    
    def save(self, user):
        """Save user"""
        self.users.append(user)
        return user


class IUserService:
    """Interface-like class for user service"""
    
    def get_user(self, user_id: str):
        raise NotImplementedError
    
    def create_user(self, data: dict):
        raise NotImplementedError
