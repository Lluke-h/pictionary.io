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
    messageContainer.appendChild(messageElement);
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
ctx.strokeStyle = '#000000';

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
    // Player can only draw if it is his turn
    if (myTurn) {
        startDraw();
        socket.emit('startdraw');
        console.log('DRAWWWWWWWWWING')
    } else {
        console.log('not your turn sorry')
    }
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

// -------------------- Game logic ---------------------------------

let myTurn = false;
socket.on('your-turn', function (msg) {
    myTurn = true;
    getWords();
});


function getWords() {
    // get 3 random words from a random word API
    const url = 'https://random-word-api.herokuapp.com/word?number=3';

    fetch(url)
        .then(resp => resp.json())
        .then(data => {
            console.log(data);
            chooseWord(data)
        })
        .catch(err => {
            console.error(err.message)
        });

}

function chooseWord(words) {
    let word = 'placeholder';
    console.log('Choose a word');
    const container = document.querySelector('.canvascontainer');
    const text = document.createElement('div');
    const textContainer = document.createElement('div');
    const buttonContainer = document.createElement('div');
    textContainer.classList.add('choose-word');
    textContainer.classList.add('choose-word-text');
    buttonContainer.setAttribute('choose_word', 'note');
    text.innerText = "It's your turn to draw ! Choose a word : ";

    // 1. Create the buttons
    const button1 = document.createElement("button");
    button1.classList.add('word-button');
    button1.innerHTML = words[0];

    const button2 = document.createElement("button");
    button2.classList.add('word-button');
    button2.innerHTML = words[1];

    const button3 = document.createElement("button");
    button3.classList.add('word-button');
    button3.innerHTML = words[2];

    // 2. Append buttons
    buttonContainer.appendChild(button1);
    buttonContainer.appendChild(button2);
    buttonContainer.appendChild(button3);

    // 3. Add event handlers
    button1.addEventListener("click", function () {
        setWord(button1);
    });
    button2.addEventListener("click", function () {
        setWord(button2);
    });
    button3.addEventListener("click", function () {
        setWord(button3);
    });

    textContainer.appendChild(text);
    textContainer.appendChild(buttonContainer);
    container.insertBefore(textContainer, container.firstChild);

    function setWord(button) {
        console.log('clicked button');
        word = button.innerHTML;
        socket.emit('get-word', word);
        container.removeChild(textContainer);
    }


}

