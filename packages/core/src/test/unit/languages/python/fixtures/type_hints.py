# Type relationships: composition, returns, parameters

class User:
    """User model"""
    
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email
        self.id = None


class UserDTO:
    """Data transfer object for user"""
    
    def __init__(self, data: dict):
        self.name = data.get('name')
        self.email = data.get('email')


class UserRepository:
    """User repository with type relationships"""
    
    def __init__(self):
        self.users = []
    
    def find(self, user_id: str) -> User:
        """Returns User type"""
        return next((u for u in self.users if u.id == user_id), None)
    
    def save(self, user: User) -> User:
        """Takes User parameter, returns User"""
        self.users.append(user)
        return user
    
    def create_from_dto(self, dto: UserDTO) -> User:
        """Takes UserDTO parameter, returns User"""
        user = User(dto.name, dto.email)
        return self.save(user)


class UserService:
    """Service with composition"""
    
    repository: UserRepository  # Type hint creates composition relationship
    
    def __init__(self, repository: UserRepository):
        self.repository = repository
        self.cache = {}
    
    def get_user(self, user_id: str) -> User:
        """Get user with return type"""
        if user_id in self.cache:
            return self.cache[user_id]
        
        user = self.repository.find(user_id)
        self.cache[user_id] = user
        return user
    
    def create_user(self, dto: UserDTO) -> User:
        """Create user with DTO parameter"""
        return self.repository.create_from_dto(dto)
