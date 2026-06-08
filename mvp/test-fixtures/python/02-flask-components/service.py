from typing import List, Optional
from datetime import datetime
from models import User


class UserService:
    """User service handling business logic"""
    
    def __init__(self):
        self._users: List[User] = []
        self._next_id = 1
    
    def create_user(self, name: str, email: str) -> User:
        user = User(
            id=self._next_id,
            name=name,
            email=email,
            created_at=datetime.now()
        )
        self._users.append(user)
        self._next_id += 1
        return user
    
    def get_user(self, user_id: int) -> Optional[User]:
        for user in self._users:
            if user.id == user_id:
                return user
        return None
    
    def get_all_users(self) -> List[User]:
        return self._users.copy()
    
    def update_user(self, user_id: int, name: Optional[str] = None, 
                   email: Optional[str] = None) -> Optional[User]:
        user = self.get_user(user_id)
        if not user:
            return None
        
        if name:
            user.name = name
        if email:
            user.email = email
        return user
    
    def delete_user(self, user_id: int) -> bool:
        for i, user in enumerate(self._users):
            if user.id == user_id:
                self._users.pop(i)
                return True
        return False
