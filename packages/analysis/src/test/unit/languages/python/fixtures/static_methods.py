# Static methods and class methods

class ValidationUtils:
    """Utility class with static methods"""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        return '@' in email and '.' in email
    
    @staticmethod
    def validate_password(password: str) -> bool:
        """Validate password strength"""
        return len(password) >= 8
    
    @staticmethod
    def sanitize(data: str) -> str:
        """Sanitize input data"""
        return data.strip().lower()


class UserService:
    """Service that calls static methods"""
    
    def __init__(self):
        self.users = []
    
    def create_user(self, email: str, password: str):
        """Create user with validation"""
        # Call static methods
        if not ValidationUtils.validate_email(email):
            raise ValueError("Invalid email")
        
        if not ValidationUtils.validate_password(password):
            raise ValueError("Weak password")
        
        clean_email = ValidationUtils.sanitize(email)
        
        user = {'email': clean_email, 'password': password}
        self.users.append(user)
        return user
    
    def update_user(self, user_id: str, email: str):
        """Update user email"""
        if ValidationUtils.validate_email(email):
            # Find and update user
            return True
        return False


class StringUtils:
    """String utility with class methods"""
    
    _instance = None
    
    @classmethod
    def get_instance(cls):
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @staticmethod
    def capitalize(text: str) -> str:
        """Capitalize text"""
        return text.upper()


class NameFormatter:
    """Formatter using StringUtils"""
    
    def format_name(self, name: str) -> str:
        """Format name using static method"""
        return StringUtils.capitalize(name)
