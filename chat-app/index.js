const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// object to store the connected users
let connectedUsers = {};

// array to store all messages
let messages = [];

// number to append to random names
let endNumber = 1;

// random names
let randNames = ['Chike', 'Idrissa','Kariuki', 'Dakarai', 'Wekesa', 'Ekenedilichukwu', 'Kondwani', 'Kwasi', 'Adwoa', 'Abena', 'Gyamfi'];

// link to the public folder
app.use(express.static('public'));

// socket connection
io.on('connection', (socket) => {
  // when a user connects
  socket.on('user connected', (username, color) => {
    // if they didn't enter a username
    if(username === ""){
      //assign random name
      username = randNames[Math.floor(Math.random() * 11)] + endNumber;
      // ensure each name is unique by adding unique number
      endNumber += 1;
    }

    // create the user's item in the connectedUsers
    if(!Object.keys(connectedUsers).includes(socket.id)){
      connectedUsers[socket.id] = {'username' : "", 'color' : ""};
    }
    // add the details if the username is unique
    let unique = true;
    let userDetails = Object.values(connectedUsers);
    for(let i = 0; i < userDetails.length; i++){
      if(userDetails[i]['username'] === username){
        unique = false;
        break;
      }
    }
    
    if(unique){
      connectedUsers[socket.id] = {'username' : username, 'color' : color};
      io.emit('user connected', connectedUsers, messages, socket.id);
    }
    else{
      // otherwise, emit that the login failed
      io.emit('login failed', socket.id);
    }
    
  })

  // when a user disconnects
  socket.on('disconnect', () => {
    // delete them from the connected users and emit the connectedUsers
    delete connectedUsers[socket.id];
    io.emit('user connected', connectedUsers);
  });

  // when a user sends a chat message
  socket.on('chat message', (msg, username, color) => {
    // get the current time
    const d = new Date();
    my_time = d.toLocaleTimeString();
    // add the message to the messages array
    messages.push({'userId': socket.id, 'username':username, 'userColor': color,  'message': msg, 'time': my_time});
    // emmit this new message details and all the messages
    io.emit('chat message', msg, my_time, username, messages, socket.id, connectedUsers[socket.id]['color']);
  });

  // when a user want to update their nickname
  socket.on('update user nick', (id, newName) => {
    // add the details if the username is unique
    let unique = true;
    let userDetails = Object.values(connectedUsers);
    for(let i = 0; i < userDetails.length; i++){
      if(userDetails[i]['username'] === newName){
        unique = false;
        break;
      }
    }

    if(unique && newName !== ""){
      connectedUsers[socket.id]['username'] = newName;
      io.emit('user nick updated', newName, socket.id, connectedUsers);
    }
    else{
      // otherwise, say that the update failed
      io.emit('user nick update failed', socket.id);
    }
  });

  // when a user wants to change their color
  socket.on('user color updated', (id, newColor) => {
    // change the color and emit the updated connectedUsers
    connectedUsers[id]['color'] = newColor;
    io.emit('user color updated', connectedUsers);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});