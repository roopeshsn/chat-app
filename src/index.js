const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = socketio(server);

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

// Protocols
// socket.emit, io.emit, socket.broadcast.emit
// io.to.emit, socket.broadcast.to.emit

io.on("connection", (socket) => {
  console.log("Connection is established");

  // Receiving username and room data from the client
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    console.log(user.username);

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    // Welcome message when a new user has joined
    socket.emit("message", generateMessage("You", "Welcome!"));

    // Telling other users that a new user has joined
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("You", `${user.username} has joined`));

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  // Receiving message from the user and sending them to all other users
  socket.on("sendMessage", (message, acknowledgement) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", generateMessage(user.username, message));
    acknowledgement("Delivered!");
  });

  // Telling other users that a user has leaved
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    console.log(user);
    if (user) {
      io.to(user.room).emit("message", generateMessage("You", `${user.username} has left!`));
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  // Receiving a user location and sending them to all other users
  socket.on("sendLocation", ({ latitude, longitude }, acknowledgement) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`)
    );
    acknowledgement("Location shared!");
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}!`);
});
