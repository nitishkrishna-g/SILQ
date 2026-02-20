import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/taskRoutes';
import { setupSocketHandlers } from './socket/SocketHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = parseInt(process.env.PORT || '3001', 10);

const allowedOrigins = [
    CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:3001'
];

// Middleware
app.use(cors({
    origin: true, // Reflect request origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json());

// Log middleware for debugging connections
app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// REST routes
app.get('/', (req, res) => {
    res.send('🚀 SILQ Server is running and live!');
});
app.use('/api', taskRoutes);

// Socket.IO setup
const io = new SocketIOServer(server, {
    cors: {
        origin: true, // Reflect request origin
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
});

// Setup WebSocket event handlers
setupSocketHandlers(io);

// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📡 WebSocket server ready');
    console.log(`🔗 CORS allowed from: ${CLIENT_URL}`);
});

export { app, server, io };
