// Type relationships using JSDoc annotations

/**
 * @typedef {Object} User
 * @property {string} name
 * @property {string} email
 * @property {string} id
 */

/**
 * @typedef {Object} UserDTO
 * @property {string} name
 * @property {string} email
 */

class UserRepository {
  constructor() {
    this.users = [];
  }

  /**
   * @param {string} userId
   * @returns {User}
   */
  find(userId) {
    return this.users.find(u => u.id === userId);
  }

  /**
   * @param {User} user
   * @returns {User}
   */
  save(user) {
    this.users.push(user);
    return user;
  }
}

class UserService {
  /**
   * @param {UserRepository} repository
   */
  constructor(repository) {
    this.repository = repository;
    this.cache = {};
  }

  /**
   * @param {string} userId
   * @returns {User}
   */
  getUser(userId) {
    if (this.cache[userId]) {
      return this.cache[userId];
    }
    
    const user = this.repository.find(userId);
    this.cache[userId] = user;
    return user;
  }

  /**
   * @param {UserDTO} dto
   * @returns {User}
   */
  createUser(dto) {
    return this.repository.save(dto);
  }
}

module.exports = { UserRepository, UserService };
