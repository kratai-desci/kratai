// Basic OOP patterns with classes and inheritance

class BaseService {
  constructor() {
    this.isActive = true;
  }

  validate(data) {
    return true;
  }

  process() {
    // Process data
  }
}

class UserService extends BaseService {
  constructor(repository) {
    super();
    this.repository = repository;
    this._cache = {};
  }

  getUser(userId) {
    return this.repository.find(userId);
  }

  createUser(data) {
    if (this.validate(data)) {
      return this.repository.save(data);
    }
    return null;
  }
}

class UserRepository {
  constructor() {
    this.users = [];
  }

  find(userId) {
    return this.users.find(u => u.id === userId);
  }

  save(user) {
    this.users.push(user);
    return user;
  }
}

// Interface-like class (using JSDoc)
/**
 * @interface
 */
class IUserService {
  getUser(userId) {
    throw new Error('Not implemented');
  }

  createUser(data) {
    throw new Error('Not implemented');
  }
}

module.exports = { BaseService, UserService, UserRepository, IUserService };
