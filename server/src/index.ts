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
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json());

// REST routes
app.get('/', (req, res) => {
    res.send('🚀 SILQ Server is running and live!');
});
app.use('/api', taskRoutes);

// Socket.IO setup
const io = new SocketIOServer(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
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
