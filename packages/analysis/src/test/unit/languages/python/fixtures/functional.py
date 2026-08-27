# Functional programming patterns

def validate_user(data: dict) -> bool:
    """Validate user data"""
    return 'name' in data and 'email' in data


def save_user(data: dict):
    """Save user to database"""
    print(f"Saving user: {data['name']}")
    return data


def create_user(data: dict):
    """Create user (calls other functions)"""
    if validate_user(data):
        return save_user(data)
    return None


def update_user(user_id: str, data: dict):
    """Update existing user"""
    if validate_user(data):
        existing = get_user(user_id)
        if existing:
            existing.update(data)
            return save_user(existing)
    return None


def get_user(user_id: str):
    """Get user by ID"""
    # Simulated database lookup
    return {'id': user_id, 'name': 'Test'}


def delete_user(user_id: str) -> bool:
    """Delete user"""
    user = get_user(user_id)
    if user:
        print(f"Deleting user: {user_id}")
        return True
    return False


def process_users(users: list):
    """Process multiple users"""
    return [create_user(u) for u in users if validate_user(u)]
