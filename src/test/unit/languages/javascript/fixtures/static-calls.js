// Static methods and static calls

class ValidationUtils {
  static validateEmail(email) {
    return email && email.includes('@') && email.includes('.');
  }

  static validatePassword(password) {
    return password && password.length >= 8;
  }

  static sanitize(data) {
    return data.trim().toLowerCase();
  }
}

class UserService {
  constructor() {
    this.users = [];
  }

  createUser(email, password) {
    // Call static methods
    if (!ValidationUtils.validateEmail(email)) {
      throw new Error('Invalid email');
    }
    
    if (!ValidationUtils.validatePassword(password)) {
      throw new Error('Weak password');
    }
    
    const cleanEmail = ValidationUtils.sanitize(email);
    
    const user = { email: cleanEmail, password };
    this.users.push(user);
    return user;
  }

  updateUser(userId, email) {
    if (ValidationUtils.validateEmail(email)) {
      return true;
    }
    return false;
  }
}

class StringUtils {
  static capitalize(text) {
    return text.toUpperCase();
  }
}

class NameFormatter {
  formatName(name) {
    return StringUtils.capitalize(name);
  }
}

module.exports = { ValidationUtils, UserService, StringUtils, NameFormatter };
