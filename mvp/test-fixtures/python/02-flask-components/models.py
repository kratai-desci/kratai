from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class User:
    """User data model"""
    id: int
    name: str
    email: str
    created_at: datetime
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }
