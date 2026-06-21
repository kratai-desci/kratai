// Async/await patterns

async function fetchUser(userId) {
  await new Promise(resolve => setTimeout(resolve, 100));
  return { id: userId, name: 'User' };
}

async function fetchUserDetails(userId) {
  const user = await fetchUser(userId);
  return user;
}

async function getUsers(userIds) {
  const promises = userIds.map(uid => fetchUser(uid));
  const users = await Promise.all(promises);
  return users;
}

async function processUser(userId) {
  const user = await fetchUser(userId);
  const details = await fetchUserDetails(userId);
  return { ...user, ...details };
}

class AsyncUserService {
  constructor() {
    this.cache = {};
  }

  async getUser(userId) {
    if (this.cache[userId]) {
      return this.cache[userId];
    }
    
    const user = await fetchUser(userId);
    this.cache[userId] = user;
    return user;
  }

  async updateUser(userId, data) {
    const user = await this.getUser(userId);
    Object.assign(user, data);
    return user;
  }
}

module.exports = { fetchUser, fetchUserDetails, getUsers, processUser, AsyncUserService };
