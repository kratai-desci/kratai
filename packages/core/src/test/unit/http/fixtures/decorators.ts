/**
 * HTTP Route Decorators Test Fixture
 * Tests detection of @Get, @Post, @Put, @Delete, @Patch decorators
 */

// Decorator declarations (for TypeScript compiler)
declare function Get(path: string): any;
declare function Post(path: string): any;
declare function Put(path: string): any;
declare function Delete(path: string): any;
declare function Patch(path: string): any;

// NestJS-style route decorators
export class UserController {
    // MUST detect: GET /api/users
    @Get('/api/users')
    async getUsers(): Promise<any[]> {
        return [];
    }

    // MUST detect: GET /api/users/:id
    @Get('/api/users/:id')
    async getUserById(id: string): Promise<any> {
        return { id };
    }

    // MUST detect: POST /api/users
    @Post('/api/users')
    async createUser(data: any): Promise<any> {
        return data;
    }

    // MUST detect: PUT /api/users/:id
    @Put('/api/users/:id')
    async updateUser(id: string, data: any): Promise<any> {
        return { id, ...data };
    }

    // MUST detect: DELETE /api/users/:id
    @Delete('/api/users/:id')
    async deleteUser(id: string): Promise<any> {
        return { deleted: true };
    }

    // MUST detect: PATCH /api/users/:id
    @Patch('/api/users/:id')
    async patchUser(id: string, data: any): Promise<any> {
        return { id, ...data };
    }
}

export class PostController {
    // MUST detect: GET /api/posts
    @Get('/api/posts')
    async getPosts(): Promise<any[]> {
        return [];
    }

    // MUST detect: POST /api/posts
    @Post('/api/posts')
    async createPost(data: any): Promise<any> {
        return data;
    }
}

// Function decorator (not a class method - should NOT be detected as route)
function decorator(target: any) {}
