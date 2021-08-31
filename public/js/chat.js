const socket = io();

// Elements
const messageForm = document.getElementById("message-form");
const messageFormInput = messageForm.querySelector("input");
const messageFormSendBtn = messageForm.querySelector("#send-message-btn");
const messageFormSendLocationBtn = document.querySelector("#send-location-btn");
const messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Extracting query string
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Auto scroll
const autoscroll = () => {
  // New message element
  const newMessage = messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = messages.offsetHeight;

  // Height of messages container
  const containerHeight = messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

// Receiving message from the server
socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// Sending messages to the server
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  messageFormSendBtn.setAttribute("disabled", "disabled");
  const message = messageFormInput.value;
  socket.emit("sendMessage", message, (acknowledgementMessage) => {
    messageFormSendBtn.removeAttribute("disabled");
    messageFormInput.value = "";
    messageFormInput.focus();
    console.log(acknowledgementMessage);
  });
});

// Sending location to the server
messageFormSendLocationBtn.addEventListener("click", (e) => {
  e.preventDefault();
  messageFormSendLocationBtn.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    socket.emit("sendLocation", { latitude, longitude }, (acknowledgementMessage) => {
      messageFormSendLocationBtn.removeAttribute("disabled");
      console.log(acknowledgementMessage);
    });
  });
});

// Receiving location from the server
socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

// Sending username and room data to the server
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});

// Rendering users in room
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  document.querySelector("#sidebar").innerHTML = html;
});
