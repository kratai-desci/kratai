/**
 * HTTP Client Calls Test Fixture
 * Tests detection of fetch(), axios, and other HTTP client calls
 */

// Axios type declaration (for TypeScript compiler)
declare const axios: {
    get(url: string): Promise<any>;
    post(url: string, data?: any): Promise<any>;
    put(url: string, data?: any): Promise<any>;
    delete(url: string): Promise<any>;
    patch(url: string, data?: any): Promise<any>;
};

export class UserService {
    // MUST detect: GET /api/users (fetch with default method)
    async getUsers() {
        const response = await fetch('/api/users');
        return response.json();
    }

    // MUST detect: GET /api/users/:id
    async getUserById(id: string) {
        const response = await fetch(`/api/users/${id}`);
        return response.json();
    }

    // MUST detect: POST /api/users
    async createUser(data: any) {
        const response = await fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    }

    // MUST detect: PUT /api/users/:id
    async updateUser(id: string, data: any) {
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    }

    // MUST detect: DELETE /api/users/:id
    async deleteUser(id: string) {
        const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    // External API (should NOT match internal routes)
    async fetchExternal() {
        const response = await fetch('https://external-api.com/data');
        return response.json();
    }
}

export class PostService {
    // MUST detect: GET /api/posts (axios shorthand)
    async getPosts() {
        const response = await axios.get('/api/posts');
        return response.data;
    }

    // MUST detect: POST /api/posts
    async createPost(data: any) {
        const response = await axios.post('/api/posts', data);
        return response.data;
    }

    // MUST detect: PUT /api/posts/:id
    async updatePost(id: string, data: any) {
        const response = await axios.put(`/api/posts/${id}`, data);
        return response.data;
    }

    // MUST detect: DELETE /api/posts/:id
    async deletePost(id: string) {
        const response = await axios.delete(`/api/posts/${id}`);
        return response.data;
    }

    // MUST detect: PATCH /api/posts/:id
    async patchPost(id: string, data: any) {
        const response = await axios.patch(`/api/posts/${id}`, data);
        return response.data;
    }
}

// React component with HTTP calls
export function UserList() {
    // MUST detect: GET /api/users
    const loadUsers = async () => {
        const users = await fetch('/api/users');
        return users.json();
    };

    // MUST detect: DELETE /api/users/:id
    const deleteUser = async (id: string) => {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
    };

    return null;
}
