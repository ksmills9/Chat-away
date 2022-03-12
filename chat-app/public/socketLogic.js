// user's details
let username = '';
let userColor = '';
let userID = '';

// Get the set nickname button
let loginBtn = document.getElementById("login");
// Get the nickname field
let inputNick = document.getElementById("user-nickname");
// get the Username display
let userHeader = document.getElementById("your-user-title");
// get the color picked
let colorPicker = document.getElementById("user-color"); 
// Get the <span> element that closes the modal
let closeBtn = document.getElementsByClassName("close")[0];
// Get the message sending form
let form = document.getElementById('form');
// get the input box that holds the messsages
let input = document.getElementById('input');
// get messages ul
let messagesElement = document.getElementById('messages');
// get the users ul
let users = document.getElementById('users');

let messagesScroller = document.getElementById('message-list-container');

// Messages stored on client side
let messages = [];
// ConnectedUsers stored on client side
let connectedUsers = [];

let socket = io();


// When the user clicks on <span> (x), close the modal
closeBtn.onclick = function() {
    // save their id
    userID = socket.id;
    //save the user color
    userColor = 'FF0000';
    // say that the user is trying to log in
    socket.emit('user connected', "", colorPicker.value.substr(1));
    // hide the modal
    modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        // save their id
        userID = socket.id;
        //save the user color
        userColor = 'FF0000';
        // say that the user is trying to log in
        socket.emit('user connected', "", colorPicker.value.substr(1));
        // hide the modal
        modal.style.display = "none";
    }
}


// function to update the user's username on both sides after receiving that validation is done
function updateUsername (name) {
    // save the username
    username = name;
    // update the title
    userHeader.innerHTML = "Logged in as: " + username;
    // tell the server that the users name has changed
    socket.emit('user nick updated', userID, name);
}

// Initial login with modal
loginBtn.onclick = function() {
    // save the user id
    userID = socket.id;
    // say that the user is trying to log in
    socket.emit('user connected', inputNick.value, colorPicker.value.substr(1));

}

// when the login failed
socket.on('login failed', function(failedID){
    // if the current user failed to login
    if(userID === failedID){
        // show the erro message
        let errorBox = document.getElementById("loginErrorMsg");
        errorBox.innerHTML="Someone already has that username, please choose a unique username";
    }
});

// when a user tries to send a message
form.addEventListener('submit', function(e) {
    e.preventDefault();
    // get the value from the chat box
    let chatMsg = input.value;
    // if the message was a command
    if(chatMsg[0] === '/'){
        // update color command
        if(chatMsg.substring(0,10) === '/nickcolor'){
            let newColor = chatMsg.substr(11);
            userColor = newColor;
            // tell the server that the users color has changed
            socket.emit('user color updated', userID, newColor);
        }
        else if(chatMsg.substring(0,5) === '/nick'){
            // update nickname command
            let newNick = chatMsg.substr(6);
            
            // tell the server that the users name has changed
            socket.emit('update user nick', userID, newNick);
        }
        else{
            // the command does not exist
            alert("Invalid command!");
        }
    }
    else if (input.value) {
        // otherwise it is just chat message, so tell the server this
        socket.emit('chat message', input.value, username, userColor);
    }
    // clear the chat box
    input.value = '';
});


function updateUsers(connUsers) {
    // update the users list by first clearing it
    users.innerHTML = "";
    // with the new list of connected users
    for(const user in connUsers){
        let userItem = 
        '<li style="display: flex; gap: 10px">'+
            `<p style = 'color:#${connUsers[user].color}'>`+ connUsers[user].username + "</p>"
        '</li>';
        // display them
        users.innerHTML = users.innerHTML + userItem;
        window.scrollTo(0, document.body.scrollHeight);
    }
    // update the connectedUsers
    connectedUsers = connUsers;
}


// when a new user connects
socket.on('user connected', function(connUsers, oldMessages, newUserID) {

    // update the users list
    updateUsers(connUsers);

    // if it the current user that is logging in
    if(userID === newUserID){

        // clear the error box in case there is anything in it
        let errorBox = document.getElementById("loginErrorMsg");
        errorBox.innerHTML="";
        // close the modal
        modal.style.display = "none";
        
        // save the username
        username = connUsers[newUserID]['username'];
        // update the title
        userHeader.innerHTML = "Logged in as: " + username;
        // display all the old messages
        messages = oldMessages;

        // render all the old messages
        for(let i = 0; i < messages.length; i ++){
            let currMsg = messages[i];
            let currMsgColor = '#'+currMsg['userColor'];

            let messageItem;
            // render the message in bold if they logged in as the user that sent it
            if(currMsg['userId'] === userID){
                messageItem = 
                '<li style="display: flex; gap: 10px">'+
                    "<p>"+ currMsg['time'] + "</p>" +
                    `<p style = 'color:${currMsgColor}'>`+ currMsg['username'] + ": </p>" + 
                    "<p style = 'font-weight:bold'>"+ currMsg['message'] +"</p>" +
                '</li>';
            }
            else{
                messageItem = 
                '<li style="display: flex; gap: 10px">'+
                    "<p>"+ currMsg['time'] + "</p>" +
                    `<p style = 'color:${currMsgColor}'>`+ currMsg['username'] + ": </p>" + 
                    "<p>"+ currMsg['message'] +"</p>" +
                '</li>';
            }
            // update the messages div
            messagesElement.innerHTML = messagesElement.innerHTML + messageItem;
            // scroll to the lates
            messagesScroller.scrollTop = messagesScroller.scrollHeight;
        }
    }


});

// when user disconnects
socket.on('disconnect', function (connUsers){
    // update the user list
    updateUsers(connUsers);

});

// when a chat is emmited
socket.on('chat message', function(msg, currTime, uName, allMessages,uID, uColor) {
    // create the html item
    let msgUserColor = "#"+uColor;
    let newItem;
    if(uID === userID){
        newItem = 
        '<li style="display: flex; gap: 10px">'+
            "<p>"+ currTime + "</p>" +
            `<p style = 'color:${msgUserColor}'>`+ uName + ": </p>" + 
            "<p style = 'font-weight:bold'>"+ msg +"</p>" +
        '</li>';
    }
    else{
        newItem = 
        '<li style="display: flex; gap: 10px">'+
            "<p>"+ currTime + "</p>" +
            `<p style = 'color:${msgUserColor}'>`+ uName + ": </p>" + 
            "<p>"+ msg +"</p>" +
        '</li>';
    }

    // display it
    messagesElement.innerHTML = messagesElement.innerHTML + newItem;
    // update the messages
    messages = allMessages;
    // scroll to the latest message
    messagesScroller.scrollTop = messagesScroller.scrollHeight;
});

// when a user nickname is udpated
socket.on('user nick updated', function (updatedName, id, connUsers){
    // if the current user executed the command
    if(userID === id){
        // save the username
        username = updatedName;
        // update the title
        userHeader.innerHTML = "Logged in as: " + username;
    }
    // update the users
    updateUsers(connUsers);
    
});

// when a user nickname update failed
socket.on('user nick update failed', function(failedID){
    // if the current user executed the command
    if(userID === failedID){
        // tell them the error
        alert("Another user has already logged in with that username. Please choose another. P.s. It may be you :)");
    }
});

// when a user color is updated
socket.on('user color updated', function(connUsers){
    updateUsers(connUsers);
});