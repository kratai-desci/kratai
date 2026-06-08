from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import UserCreate, UserUpdate, UserResponse
from service import UserService


router = APIRouter(prefix="/users", tags=["users"])


def get_user_service() -> UserService:
    """Dependency injection for user service"""
    return UserService()


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service)
):
    """Create a new user"""
    user = service.create_user(user_data)
    return user


@router.get("/", response_model=List[UserResponse])
async def get_all_users(service: UserService = Depends(get_user_service)):
    """Get all users"""
    users = service.get_all_users()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service)
):
    """Get user by ID"""
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    service: UserService = Depends(get_user_service)
):
    """Update user"""
    user = service.update_user(user_id, user_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service)
):
    """Delete user"""
    success = service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
