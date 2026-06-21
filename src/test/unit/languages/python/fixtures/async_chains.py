# Async/await patterns

import asyncio


async def fetch_user(user_id: str):
    """Async fetch user"""
    await asyncio.sleep(0.1)  # Simulate network delay
    return {'id': user_id, 'name': 'User'}


async def fetch_user_details(user_id: str):
    """Async fetch with await call to another async function"""
    user = await fetch_user(user_id)  # Async call
    return user


async def get_users(user_ids: list):
    """Async function calling multiple async functions"""
    tasks = [fetch_user(uid) for uid in user_ids]
    users = await asyncio.gather(*tasks)
    return users


async def process_user(user_id: str):
    """Async processing chain"""
    user = await fetch_user(user_id)
    details = await fetch_user_details(user_id)
    return {**user, **details}


class AsyncUserService:
    """Service with async methods"""
    
    def __init__(self):
        self.cache = {}
    
    async def get_user(self, user_id: str):
        """Async get user"""
        if user_id in self.cache:
            return self.cache[user_id]
        
        user = await fetch_user(user_id)
        self.cache[user_id] = user
        return user
    
    async def update_user(self, user_id: str, data: dict):
        """Async update"""
        user = await self.get_user(user_id)
        user.update(data)
        return user
