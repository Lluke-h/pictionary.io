const express = require('express');
app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


let players = {};
let gameState = {};
let word = 'banana';
//on connect
//Whenever someone connects this gets executed

io.on('connection', function (socket) {
    // New connection handling
    socket.on('new-user', name => {
        // if it's the first player the it's his turn
        if (Object.keys(players).length === 0) {
            // The player chooses a word which is sent back as an acknowledgment
            socket.emit('your-turn', "It's your turn !");
            socket.on('get-word', (word) => {
                console.log('the word is ', word);
                gameState = {playerDrawing: players[socket.id], word: word};

            });
        }


        players[socket.id] = {id: socket.id, name: name, score: 0, drawing: false};
        console.log(`player ${name} has connected`);
        socket.broadcast.emit('user-connected', name);

        // get the current drawing from the other players
        if (players !== {}) {
            console.log('requested drawing from all ');
            socket.broadcast.emit('send-drawing', 'please send drawing');
            socket.on('whole-drawing', drawing => {
                console.log('sending drawing to', players[socket.id].name);
                socket.broadcast.emit('receive-drawing', drawing)
            })
        }


    });


    // Chat messages
    socket.on('send-chat-message', msg => handleMessage(msg));

    function handleMessage(message) {
        if (message.toLowerCase().includes(word)) {
            if (message.toLowerCase() === word) { // player found word
                io.to(`${socket.id}`).emit('chat-message', {
                    message: "You HAVE FOUND THE  WORD !!",
                    name: players[socket.id].name
                });
                socket.broadcast.emit('chat-message', {
                    message: `${players[socket.id].name} has found the word !`,
                    name: ''
                });
            } else {
                io.to(`${socket.id}`).emit('chat-message', {message: "You are close !", name: players[socket.id].name})
            }
        } else {
            socket.broadcast.emit('chat-message', {message: message, name: players[socket.id].name});
        }
    }

    // Drawing

    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data);
    });
    socket.on('startdraw', (data) => {
        socket.broadcast.emit('startdraw');
    });
    socket.on('stopdraw', (data) => {
        socket.broadcast.emit('stopdraw');
    });


    //Whenever someone disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        socket.broadcast.emit('user-disconnected', players[socket.id].name);
        delete players[socket.id];
        // io.sockets.emit('playerupdate', players);
    });
});

const port = 3000;
server.listen(3000, function () {
    console.log('listening on port ', port);
});


// let counter = 0;
// setInterval(function() {
//     counter = counter + 1;
//     io.sockets.emit('message', counter);
// }, 1000);