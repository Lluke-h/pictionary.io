// const socket = io();
const socket = io.connect('http://localhost:3000');


//

const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('message-container');

// ---------------- Chat ------------------
//sending a message
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    console.log(message);
    appendMessage(`You : ${message}`);
    socket.emit('send-chat-message', message);
    messageInput.value = '';
});
//Receiving a message
socket.on('chat-message', data => appendMessage(`${data.name} : ${data.message}`));

socket.on('user-connected', name => {
    appendMessage(`${name} has joined the game`)
});

socket.on('user-disconnected', name => {
    appendMessage(`${name} has left the game`)
});

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.appendChild(messageElement)
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// -------------- Join game ---------------

const name = prompt('Enter your name');
appendMessage('You joined the game');
socket.emit('new-user', name);
socket.on('receive-drawing', drawing => {
    console.log('received drawing');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = drawing;
});


// ------------------------ Drawing -------------------------


socket.on('message', socket => console.log(socket));
socket.on('draw', data => {
    isDrawing = true;
    console.log('received coords');
    draw(data);

    isDrawing = false
});
socket.on('startdraw', startDraw);
socket.on('stopdraw', stopDraw);
socket.on('playerupdate', players => updatePlayercards(players));

const canvas = document.querySelector('#draw');
const ctx = canvas.getContext('2d');

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#BADA55';

let isDrawing = false;
let lastX = -1;
let lastY = -1;
let hue = 0;
linewidth = 0;

function draw(e) {
    if (!isDrawing) return;
    // ctx.strokeStyle = `hsl(${hue}, 86%, 50%)`;
    ctx.strokeStyle = `1, 86%, 50%)`;
    ctx.lineWidth = 10; //+ 15 * Math.sin(linewidth);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    hue += 5;
    linewidth += 0.1;
    [lastX, lastY] = [e.offsetX, e.offsetY];

}

function startDraw() {
    isDrawing = true;
    [lastX, lastY] = [this.offsetX, this.offsetY];
}

function stopDraw() {
    isDrawing = false
}

function updatePlayercards(players) {
    console.log('update player cards');
    const playercards = document.querySelector('.playercards');
    playercards.innerHTML = "";

    // players.forEach(player => {
    //     console.log('added playerCard !!!');
    //     const card = document.createElement('div');
    //     card.textContent = player.id;
    //     card.setAttribute('class', 'playercard');
    //     playercards.appendChild(card);
    // });
}

canvas.addEventListener('mousemove', (e) => {
    draw(e);
    if (isDrawing) {
        const {offsetX, offsetY} = e;
        socket.emit('draw', {offsetX: offsetX, offsetY: offsetY});
    }
});

canvas.addEventListener('mousedown', () => {
    startDraw();
    socket.emit('startdraw')
});

canvas.addEventListener('mouseup', () => {
    stopDraw();
    socket.emit('stopdraw')
});

canvas.addEventListener('mouseout', () => {
    stopDraw();
    socket.emit('stopdraw')
});

//send whole drawing if asked

socket.on('send-drawing', () => {
    drawing = canvas.toDataURL();
    socket.emit('whole-drawing', drawing);
    console.log('Sending back drawing');
});

