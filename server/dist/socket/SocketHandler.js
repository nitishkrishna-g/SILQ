"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = setupSocketHandlers;
const TaskService_1 = require("../services/TaskService");
const PresenceService_1 = require("../services/PresenceService");
const HistoryService_1 = require("../services/HistoryService");
const schemas_1 = require("../validation/schemas");
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);
        // --- User joins with identity ---
        socket.on('USER_JOIN', (data) => {
            PresenceService_1.presenceService.addUser(socket.id, data);
            // Broadcast UNIQUE users list
            io.emit('USERS_UPDATED', PresenceService_1.presenceService.getConnectedUsers());
            console.log(`[Socket] User joined: ${data.username} (socket: ${socket.id})`);
        });
        // --- CREATE TASK ---
        socket.on('TASK_CREATE', async (data) => {
            const parsed = schemas_1.createTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_CREATE', errors: parsed.error.flatten() });
                return;
            }
            try {
                const { task, log } = await TaskService_1.taskService.createTask(parsed.data);
                io.emit('TASK_CREATED', task);
                if (log)
                    io.emit('HISTORY_ADDED', log);
            }
            catch (err) {
                socket.emit('ERROR', { event: 'TASK_CREATE', message: 'Failed to create task' });
            }
        });
        // --- UPDATE TASK ---
        socket.on('TASK_UPDATE', async (data) => {
            const parsed = schemas_1.updateTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_UPDATE', errors: parsed.error.flatten() });
                return;
            }
            try {
                const { task, conflict, log } = await TaskService_1.taskService.updateTask(parsed.data);
                if (conflict) {
                    socket.emit('CONFLICT_UPDATE_REJECTED', {
                        id: parsed.data.id,
                        message: 'Task was modified by another user. Your changes were rejected.',
                    });
                    const tasks = await TaskService_1.taskService.getAllTasks();
                    socket.emit('TASKS_SYNC', tasks);
                    return;
                }
                io.emit('TASK_UPDATED', task);
                if (log)
                    io.emit('HISTORY_ADDED', log);
            }
            catch (err) {
                socket.emit('ERROR', { event: 'TASK_UPDATE', message: 'Failed to update task' });
            }
        });
        // --- MOVE TASK ---
        socket.on('TASK_MOVE', async (data) => {
            const parsed = schemas_1.moveTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_MOVE', errors: parsed.error.flatten() });
                return;
            }
            try {
                const { task, conflict, log } = await TaskService_1.taskService.moveTask(parsed.data);
                if (conflict) {
                    socket.emit('CONFLICT_MOVE_REJECTED', {
                        id: parsed.data.id,
                        message: 'Task was already moved by another user.',
                    });
                    const tasks = await TaskService_1.taskService.getAllTasks();
                    socket.emit('TASKS_SYNC', tasks);
                    return;
                }
                io.emit('TASK_MOVED', task);
                if (log)
                    io.emit('HISTORY_ADDED', log);
            }
            catch (err) {
                socket.emit('ERROR', { event: 'TASK_MOVE', message: 'Failed to move task' });
            }
        });
        // --- DELETE TASK ---
        socket.on('TASK_DELETE', async (data) => {
            const parsed = schemas_1.deleteTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_DELETE', errors: parsed.error.flatten() });
                return;
            }
            try {
                const { success, conflict, log } = await TaskService_1.taskService.deleteTask(parsed.data);
                if (conflict) {
                    socket.emit('CONFLICT_DELETE_REJECTED', {
                        id: parsed.data.id,
                        message: 'Task was modified by another user before deletion.',
                    });
                    const tasks = await TaskService_1.taskService.getAllTasks();
                    socket.emit('TASKS_SYNC', tasks);
                    return;
                }
                io.emit('TASK_DELETED', { id: parsed.data.id });
                if (log)
                    io.emit('HISTORY_ADDED', log);
            }
            catch (err) {
                socket.emit('ERROR', { event: 'TASK_DELETE', message: 'Failed to delete task' });
            }
        });
        // --- LOCK TASK ---
        socket.on('TASK_LOCK', async (data) => {
            const parsed = schemas_1.lockTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_LOCK', errors: parsed.error.flatten() });
                return;
            }
            try {
                const { task, alreadyLocked } = await TaskService_1.taskService.lockTask(parsed.data);
                if (alreadyLocked) {
                    socket.emit('TASK_LOCK_REJECTED', {
                        id: parsed.data.id,
                        lockedBy: task?.lockedBy,
                        message: `Task is being edited by ${task?.lockedBy}`,
                    });
                    return;
                }
                const user = PresenceService_1.presenceService.getUserBySocket(socket.id);
                io.emit('TASK_LOCKED', {
                    id: parsed.data.id,
                    lockedBy: parsed.data.userId,
                    color: user?.color || '#6366f1',
                });
            }
            catch (err) {
                socket.emit('ERROR', { event: 'TASK_LOCK', message: 'Failed to lock task' });
            }
        });
        // --- UNLOCK TASK ---
        socket.on('TASK_UNLOCK', async (data) => {
            const parsed = schemas_1.unlockTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_UNLOCK', errors: parsed.error.flatten() });
                return;
            }
            try {
                await TaskService_1.taskService.unlockTask(parsed.data);
                io.emit('TASK_UNLOCKED', { id: parsed.data.id });
            }
            catch (err) {
                socket.emit('ERROR', { event: 'TASK_UNLOCK', message: 'Failed to unlock task' });
            }
        });
        // --- REQUEST FULL SYNC ---
        socket.on('REQUEST_SYNC', async () => {
            try {
                const tasks = await TaskService_1.taskService.getAllTasks();
                const historyLogs = await HistoryService_1.historyService.getRecentLogs(50);
                socket.emit('TASKS_SYNC', tasks);
                socket.emit('HISTORY_SYNC', historyLogs);
            }
            catch (err) {
                socket.emit('ERROR', { event: 'REQUEST_SYNC', message: 'Failed to sync tasks' });
            }
        });
        // --- DISCONNECT ---
        socket.on('disconnect', async () => {
            const result = PresenceService_1.presenceService.removeSocket(socket.id);
            if (result) {
                const { userId, isLastSocket } = result;
                // Only broadcast updated list to others
                io.emit('USERS_UPDATED', PresenceService_1.presenceService.getConnectedUsers());
                if (isLastSocket) {
                    // Unlock any tasks this user had locked ONLY if they have no other tabs open
                    await TaskService_1.taskService.unlockAllByUser(userId);
                    io.emit('USER_DISCONNECTED', { userId });
                    // Force a full task sync for remaining clients so they see the unlocked states immediately
                    const tasks = await TaskService_1.taskService.getAllTasks();
                    io.emit('TASKS_SYNC', tasks);
                    console.log(`[Socket] User offline (last tab closed): ${userId}, unlocked their tasks`);
                }
                else {
                    console.log(`[Socket] Tab closed for user: ${userId} (still online in other tabs)`);
                }
            }
        });
    });
}
//# sourceMappingURL=SocketHandler.js.map