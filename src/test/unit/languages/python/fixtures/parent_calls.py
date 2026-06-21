# Parent class method calls using super()

class BaseService:
    """Base service with validation"""
    
    def __init__(self):
        self.is_active = True
    
    def validate(self, data: dict) -> bool:
        """Validate data"""
        return isinstance(data, dict) and len(data) > 0
    
    def save(self, data: dict):
        """Save data"""
        print(f"BaseService: Saving {data}")
        return data


class UserService(BaseService):
    """User service that calls parent methods"""
    
    def __init__(self, repository):
        super().__init__()  # Call parent constructor
        self.repository = repository
    
    def validate(self, data: dict) -> bool:
        """Override validate with super call"""
        # Call parent validation first
        if not super().validate(data):
            return False
        
        # Additional validation
        return 'email' in data
    
    def save(self, user: dict):
        """Override save with super call"""
        if self.validate(user):
            # Call parent save method
            result = super().save(user)
            self.repository.add(result)
            return result
        return None


class AdminService(UserService):
    """Admin service extending UserService"""
    
    def __init__(self, repository, logger):
        super().__init__(repository)  # Call parent constructor
        self.logger = logger
    
    def save(self, user: dict):
        """Override save with logging"""
        self.logger.log("Saving admin user")
        # Call parent save (which itself calls BaseService.save)
        return super().save(user)
