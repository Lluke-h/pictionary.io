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


//on connect
//Whenever someone connects this gets executed

io.on('connection', function (socket) {

    // New connection handling
    socket.on('new-user', name => {
        // io.sockets.emit('playerupdate', players);

        players[socket.id] = {id: socket.id, name: name, score: 0, drawing: false};
        console.log(`player ${name} has connected`);
        socket.broadcast.emit('user-connected', name);

        if (players !== {}){
            console.log('requested drawing from all ');
            socket.broadcast.emit('send-drawing', 'please send drawing');
            socket.on('whole-drawing', drawing => {
                console.log('sending drawing to', players[socket.id].name);
                socket.broadcast.emit('receive-drawing', drawing)
            })


        }
    });


    // Chat messages
    socket.on('send-chat-message', message => {
        console.log(message);
        socket.broadcast.emit('chat-message', {message: message, name: players[socket.id].name});
    });
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

const port = process.env.PORT || 3000;
server.listen(3000, function () {
    console.log('listening on *:3000');
});


// let counter = 0;
// setInterval(function() {
//     counter = counter + 1;
//     io.sockets.emit('message', counter);
// }, 1000);