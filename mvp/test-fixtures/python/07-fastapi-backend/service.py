from typing import List, Optional
from datetime import datetime
from models import User, UserCreate, UserUpdate


class UserService:
    """User service handling business logic"""
    
    def __init__(self):
        self._users: List[User] = []
        self._next_id = 1
    
    def create_user(self, user_data: UserCreate) -> User:
        user = User(
            id=self._next_id,
            name=user_data.name,
            email=user_data.email,
            password=user_data.password,  # Should be hashed in real app
            created_at=datetime.now(),
            updated_at=datetime.now()
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
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        user = self.get_user(user_id)
        if not user:
            return None
        
        if user_data.name is not None:
            user.name = user_data.name
        if user_data.email is not None:
            user.email = user_data.email
        user.updated_at = datetime.now()
        return user
    
    def delete_user(self, user_id: int) -> bool:
        for i, user in enumerate(self._users):
            if user.id == user_id:
                self._users.pop(i)
                return True
        return False
