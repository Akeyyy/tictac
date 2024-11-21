const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });
let players = [];
let currentPlayer = 0;
let board = Array(9).fill(null);

server.on('connection', (ws) => {
    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
        ws.close();
        return;
    }

    players.push(ws);
    const playerIndex = players.length - 1;
    ws.send(JSON.stringify({ type: 'assign', player: playerIndex }));

    if (players.length === 2) {
        players.forEach((player, index) => {
            player.send(JSON.stringify({ type: 'start', message: `Game started. You are Player ${index + 1}` }));
        });
    }

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'move' && players[currentPlayer] === ws) {
            if (!board[data.index]) {
                board[data.index] = currentPlayer === 0 ? 'X' : 'O';
                broadcast({
                    type: 'move',
                    index: data.index,
                    player: currentPlayer,
                });

                if (checkWinner()) {
                    broadcast({ type: 'winner', player: currentPlayer });
                    resetGame();
                } else if (board.every((cell) => cell !== null)) {
                    broadcast({ type: 'draw' });
                    resetGame();
                } else {
                    currentPlayer = 1 - currentPlayer;
                }
            }
        }
    });

    ws.on('close', () => {
        players = players.filter((player) => player !== ws);
        resetGame();
        broadcast({ type: 'reset' });
    });
});

function broadcast(data) {
    players.forEach((player) => player.send(JSON.stringify(data)));
}

function checkWinner() {
    const winningCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];

    return winningCombos.some(([a, b, c]) => {
        return board[a] !== null && board[a] === board[b] && board[b] === board[c];
    });
}

function resetGame() {
    board = Array(9).fill(null);
    currentPlayer = 0;
}
