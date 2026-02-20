import { Server, Socket } from 'socket.io';
import { taskService } from '../services/TaskService';
import { presenceService } from '../services/PresenceService';
import {
    createTaskSchema,
    updateTaskSchema,
    moveTaskSchema,
    deleteTaskSchema,
    lockTaskSchema,
    unlockTaskSchema,
} from '../validation/schemas';
import { UserInfo } from '../types';

export function setupSocketHandlers(io: Server): void {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // --- User joins with identity ---
        socket.on('USER_JOIN', (data: UserInfo) => {
            presenceService.addUser(socket.id, data);

            // Broadcast UNIQUE users list
            io.emit('USERS_UPDATED', presenceService.getConnectedUsers());
            console.log(`[Socket] User joined: ${data.username} (socket: ${socket.id})`);
        });

        // --- CREATE TASK ---
        socket.on('TASK_CREATE', async (data: unknown) => {
            const parsed = createTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_CREATE', errors: parsed.error.flatten() });
                return;
            }

            try {
                const task = await taskService.createTask(parsed.data);
                io.emit('TASK_CREATED', task);
            } catch (err) {
                socket.emit('ERROR', { event: 'TASK_CREATE', message: 'Failed to create task' });
            }
        });

        // --- UPDATE TASK ---
        socket.on('TASK_UPDATE', async (data: unknown) => {
            const parsed = updateTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_UPDATE', errors: parsed.error.flatten() });
                return;
            }

            try {
                const { task, conflict } = await taskService.updateTask(parsed.data);

                if (conflict) {
                    socket.emit('CONFLICT_UPDATE_REJECTED', {
                        id: parsed.data.id,
                        message: 'Task was modified by another user. Your changes were rejected.',
                    });
                    const tasks = await taskService.getAllTasks();
                    socket.emit('TASKS_SYNC', tasks);
                    return;
                }

                io.emit('TASK_UPDATED', task);
            } catch (err) {
                socket.emit('ERROR', { event: 'TASK_UPDATE', message: 'Failed to update task' });
            }
        });

        // --- MOVE TASK ---
        socket.on('TASK_MOVE', async (data: unknown) => {
            const parsed = moveTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_MOVE', errors: parsed.error.flatten() });
                return;
            }

            try {
                const { task, conflict } = await taskService.moveTask(parsed.data);

                if (conflict) {
                    socket.emit('CONFLICT_MOVE_REJECTED', {
                        id: parsed.data.id,
                        message: 'Task was already moved by another user.',
                    });
                    const tasks = await taskService.getAllTasks();
                    socket.emit('TASKS_SYNC', tasks);
                    return;
                }

                io.emit('TASK_MOVED', task);
            } catch (err) {
                socket.emit('ERROR', { event: 'TASK_MOVE', message: 'Failed to move task' });
            }
        });

        // --- DELETE TASK ---
        socket.on('TASK_DELETE', async (data: unknown) => {
            const parsed = deleteTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_DELETE', errors: parsed.error.flatten() });
                return;
            }

            try {
                const { success, conflict } = await taskService.deleteTask(parsed.data);

                if (conflict) {
                    socket.emit('CONFLICT_DELETE_REJECTED', {
                        id: parsed.data.id,
                        message: 'Task was modified by another user before deletion.',
                    });
                    const tasks = await taskService.getAllTasks();
                    socket.emit('TASKS_SYNC', tasks);
                    return;
                }

                io.emit('TASK_DELETED', { id: parsed.data.id });
            } catch (err) {
                socket.emit('ERROR', { event: 'TASK_DELETE', message: 'Failed to delete task' });
            }
        });

        // --- LOCK TASK ---
        socket.on('TASK_LOCK', async (data: unknown) => {
            const parsed = lockTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_LOCK', errors: parsed.error.flatten() });
                return;
            }

            try {
                const { task, alreadyLocked } = await taskService.lockTask(parsed.data);

                if (alreadyLocked) {
                    socket.emit('TASK_LOCK_REJECTED', {
                        id: parsed.data.id,
                        lockedBy: task?.lockedBy,
                        message: `Task is being edited by ${task?.lockedBy}`,
                    });
                    return;
                }

                const user = presenceService.getUserBySocket(socket.id);
                io.emit('TASK_LOCKED', {
                    id: parsed.data.id,
                    lockedBy: parsed.data.userId,
                    color: user?.color || '#6366f1',
                });
            } catch (err) {
                socket.emit('ERROR', { event: 'TASK_LOCK', message: 'Failed to lock task' });
            }
        });

        // --- UNLOCK TASK ---
        socket.on('TASK_UNLOCK', async (data: unknown) => {
            const parsed = unlockTaskSchema.safeParse(data);
            if (!parsed.success) {
                socket.emit('ERROR', { event: 'TASK_UNLOCK', errors: parsed.error.flatten() });
                return;
            }

            try {
                await taskService.unlockTask(parsed.data);
                io.emit('TASK_UNLOCKED', { id: parsed.data.id });
            } catch (err) {
                socket.emit('ERROR', { event: 'TASK_UNLOCK', message: 'Failed to unlock task' });
            }
        });

        // --- REQUEST FULL SYNC ---
        socket.on('REQUEST_SYNC', async () => {
            try {
                const tasks = await taskService.getAllTasks();
                socket.emit('TASKS_SYNC', tasks);
            } catch (err) {
                socket.emit('ERROR', { event: 'REQUEST_SYNC', message: 'Failed to sync tasks' });
            }
        });

        // --- DISCONNECT ---
        socket.on('disconnect', async () => {
            const result = presenceService.removeSocket(socket.id);
            if (result) {
                const { userId, isLastSocket } = result;

                // Only broadcast updated list to others
                io.emit('USERS_UPDATED', presenceService.getConnectedUsers());

                if (isLastSocket) {
                    // Unlock any tasks this user had locked ONLY if they have no other tabs open
                    await taskService.unlockAllByUser(userId);
                    io.emit('USER_DISCONNECTED', { userId });
                    console.log(`[Socket] User offline (last tab closed): ${userId}`);
                } else {
                    console.log(`[Socket] Tab closed for user: ${userId} (still online in other tabs)`);
                }
            }
        });
    });
}
