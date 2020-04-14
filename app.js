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
        io.sockets.emit('game-update', {players, gameState});
        // add player to player list
        players[socket.id] = {id: socket.id, name: name, score: 0, drawing: false};
        // if it's the first player the it's his turn
        if (Object.keys(players).length === 1){
            setPlayerDrawing(socket);
        }
        console.log(`player ${name} has connected`);


        function setPlayerDrawing(){
            // The player chooses a word which is sent back as an acknowledgment
            players[socket.id].drawing = true;
            io.sockets.emit('game-update', {players, gameState});
            socket.emit('your-turn', "It's your turn !");
            socket.on('get-word', (word) => {
                gameState = {playerDrawing: players[socket.id], word: word};
            });


        }


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


    // Chat messages and word guesses
    socket.on('send-chat-message', msg => handleMessage(msg));
    function handleMessage(message) {
        if (message.toLowerCase().includes(gameState.word)) {
            if (message.toLowerCase() === gameState.word) { // player found word
                io.to(`${socket.id}`).emit('chat-message', {
                    message: "You've found the word !! It's your turn to draw",
                    name: 'server'
                });
                socket.broadcast.emit('chat-message', {
                    message: `${players[socket.id].name} has found the word !`,
                    name: 'server'
                });
            } else {
                io.to(`${socket.id}`).emit('chat-message', {message: "You are close !", name: 'server'})
            }
        } else {
            console.log('sent a message with name', players[socket.id].name);
            socket.broadcast.emit('chat-message', {message: message, name: players[socket.id].name});
        }
    }



    // -------------------- Drawing --------------------------

    socket.on('draw', (data) => {
        socket.broadcast.emit('draw', data);
    });
    socket.on('startdraw', (data) => {
        socket.broadcast.emit('startdraw');
    });
    socket.on('stopdraw', (data) => {
        socket.broadcast.emit('stopdraw');
    });



    // ------------- Whenever someone disconnects -----------------
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        try{
            socket.broadcast.emit('user-disconnected', players[socket.id].name);
            delete players[socket.id];
        }
        catch (e) {
            console.log('an unknown player disconnected (connected before server start)')
        }

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