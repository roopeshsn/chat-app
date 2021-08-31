let users = [];

const addUser = ({ id, username, room }) => {
  //   username = username.trim().toLowerCase();
  //   room = room.toLowerCase();

  if (!username || !room) {
    return { error: "Username and room is required" };
  }

  // Validation
  const existingUser = users.find((user) => {
    return user.username === username && user.room === room;
  });

  if (existingUser) {
    return {
      error: "Username is in use!",
    };
  }

  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const idx = users.findIndex((user) => user.id === id);
  if (idx !== -1) {
    const removedUser = users.splice(idx, 1);
    return removedUser[0];
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
