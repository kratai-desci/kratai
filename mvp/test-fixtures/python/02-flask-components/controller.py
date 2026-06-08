from flask import Flask, request, jsonify
from service import UserService


class UserController:
    """Flask controller for user routes"""
    
    def __init__(self, user_service: UserService):
        self.service = user_service
    
    def get_all(self):
        users = self.service.get_all_users()
        return jsonify([user.to_dict() for user in users])
    
    def get_by_id(self, user_id: int):
        user = self.service.get_user(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict())
    
    def create(self):
        data = request.get_json()
        user = self.service.create_user(data['name'], data['email'])
        return jsonify(user.to_dict()), 201
    
    def update(self, user_id: int):
        data = request.get_json()
        user = self.service.update_user(
            user_id,
            name=data.get('name'),
            email=data.get('email')
        )
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict())
    
    def delete(self, user_id: int):
        success = self.service.delete_user(user_id)
        if not success:
            return jsonify({'error': 'User not found'}), 404
        return '', 204
