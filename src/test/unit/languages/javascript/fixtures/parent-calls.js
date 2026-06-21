// Parent class method calls using super

class BaseService {
  constructor() {
    this.isActive = true;
  }

  validate(data) {
    return typeof data === 'object' && Object.keys(data).length > 0;
  }

  save(data) {
    console.log('BaseService: Saving', data);
    return data;
  }
}

class UserService extends BaseService {
  constructor(repository) {
    super();
    this.repository = repository;
  }

  validate(data) {
    // Call parent validation first
    if (!super.validate(data)) {
      return false;
    }
    
    // Additional validation
    return data.email !== undefined;
  }

  save(user) {
    if (this.validate(user)) {
      // Call parent save method
      const result = super.save(user);
      this.repository.add(result);
      return result;
    }
    return null;
  }
}

class AdminService extends UserService {
  constructor(repository, logger) {
    super(repository);
    this.logger = logger;
  }

  save(user) {
    this.logger.log('Saving admin user');
    // Call parent save
    return super.save(user);
  }
}

module.exports = { BaseService, UserService, AdminService };
