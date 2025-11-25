"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./server/db");
const auth_1 = __importDefault(require("./server/routes/auth"));
const chats_1 = __importDefault(require("./server/routes/chats"));
const messages_1 = __importDefault(require("./server/routes/messages"));
const users_1 = __importDefault(require("./server/routes/users"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/chats', chats_1.default);
app.use('/api/messages', messages_1.default);
app.use('/api/users', users_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Socket.io - хранилище активных пользователей
const activeUsers = new Map(); // userId -> socketId
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);
    socket.on('user:online', (userId) => {
        activeUsers.set(userId, socket.id);
        console.log(`User ${userId} online`);
        io.emit('users:active', Array.from(activeUsers.keys()));
    });
    socket.on('message:send', (data) => {
        io.to(`chat:${data.chatId}`).emit('message:received', {
            ...data,
            timestamp: new Date().toISOString(),
        });
    });
    socket.on('chat:join', (chatId) => {
        socket.join(`chat:${chatId}`);
        console.log(`User joined chat:${chatId}`);
    });
    socket.on('chat:leave', (chatId) => {
        socket.leave(`chat:${chatId}`);
    });
    socket.on('disconnect', () => {
        for (const [userId, socketId] of activeUsers.entries()) {
            if (socketId === socket.id) {
                activeUsers.delete(userId);
                break;
            }
        }
        io.emit('users:active', Array.from(activeUsers.keys()));
        console.log('User disconnected:', socket.id);
    });
});
// Запуск сервера
async function start() {
    try {
        const connected = await (0, db_1.checkConnection)();
        if (!connected) {
            console.error('Failed to connect to database');
            process.exit(1);
        }
        httpServer.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ API: http://localhost:${PORT}/api`);
            console.log(`✓ WebSocket: ws://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map