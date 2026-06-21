// Functional programming patterns

function validateUser(data) {
  return data && data.name && data.email;
}

function saveUser(data) {
  console.log(`Saving user: ${data.name}`);
  return data;
}

function createUser(data) {
  if (validateUser(data)) {
    return saveUser(data);
  }
  return null;
}

function updateUser(userId, data) {
  if (validateUser(data)) {
    const existing = getUser(userId);
    if (existing) {
      Object.assign(existing, data);
      return saveUser(existing);
    }
  }
  return null;
}

function getUser(userId) {
  return { id: userId, name: 'Test' };
}

function deleteUser(userId) {
  const user = getUser(userId);
  if (user) {
    console.log(`Deleting user: ${userId}`);
    return true;
  }
  return false;
}

function processUsers(users) {
  return users.filter(validateUser).map(createUser);
}

module.exports = { validateUser, saveUser, createUser, updateUser, getUser, deleteUser, processUsers };
