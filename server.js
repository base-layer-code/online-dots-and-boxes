const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let rooms = {};

io.on('connection', (socket) => {
    socket.on('join-room', () => {
        let roomId = Object.keys(rooms).find(id => rooms[id].players.length === 1);
        if (!roomId) {
            roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            rooms[roomId] = { players: [socket.id], config: null };
            socket.join(roomId);
            socket.emit('init', { roomId, myId: 0 });
        } else {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            socket.emit('init', { roomId, myId: 1 });
            io.to(roomId).emit('player-ready');
        }

        socket.on('start-sync', (config) => {
            io.to(roomId).emit('game-start', config);
        });

        socket.on('send-move', (lineIdx) => {
            socket.to(roomId).emit('receive-move', lineIdx);
        });

        socket.on('disconnect', () => {
            if(rooms[roomId]) delete rooms[roomId];
        });
    });
});

server.listen(process.env.PORT || 3000);
