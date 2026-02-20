'use client';

import React, { useEffect, useRef } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { logoutUser } from '@/lib/userIdentity';
import { UserInfo } from '@/types';
import toast from 'react-hot-toast';

interface SocketProviderProps {
    children: React.ReactNode;
    user: UserInfo;
    onLogout: () => void;
}

export default function SocketProvider({ children, user, onLogout }: SocketProviderProps) {
    const store = useTaskStore();

    // Expose logout so Board can call it
    useEffect(() => {
        useTaskStore.setState({
            logout: () => {
                disconnectSocket();
                logoutUser();
                onLogout();
            },
        });
    }, [onLogout]);

    useEffect(() => {
        store.setCurrentUser(user);

        const socket = connectSocket();

        // Expose socket for testing/debugging
        if (typeof window !== 'undefined') {
            (window as any).__SOCKET__ = socket;
        }

        // ------ Connection events ------
        socket.on('connect', () => {
            console.log('[Socket] Connected');
            store.setConnected(true);
            socket.emit('USER_JOIN', user);
            socket.emit('REQUEST_SYNC');

            // Replay offline queue
            if (store.offlineQueue.length > 0) {
                toast.success(`Replaying ${store.offlineQueue.length} offline action(s)...`);
                store.replayQueue();
            }
        });

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            store.setConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        // ------ Task events ------
        socket.on('TASKS_SYNC', (tasks) => {
            store.onTasksSync(tasks);
        });

        socket.on('TASK_CREATED', (task) => {
            store.onTaskCreated(task);
        });

        socket.on('TASK_UPDATED', (task) => {
            store.onTaskUpdated(task);
        });

        socket.on('TASK_MOVED', (task) => {
            store.onTaskMoved(task);
        });

        socket.on('TASK_DELETED', (data) => {
            store.onTaskDeleted(data.id);
        });

        // ------ Conflict events ------
        socket.on('CONFLICT_MOVE_REJECTED', (data) => {
            toast.error(data.message || 'Move conflict: task was already moved by another user.');
            store.onConflictRejected(data.id);
        });

        socket.on('CONFLICT_UPDATE_REJECTED', (data) => {
            toast.error(data.message || 'Update conflict: task was modified by another user.');
            store.onConflictRejected(data.id);
        });

        socket.on('CONFLICT_DELETE_REJECTED', (data) => {
            toast.error(data.message || 'Delete conflict: task was modified before deletion.');
            store.onConflictRejected(data.id);
        });

        // ------ Presence events ------
        socket.on('TASK_LOCKED', (data) => {
            store.onTaskLocked(data);
        });

        socket.on('TASK_UNLOCKED', (data) => {
            store.onTaskUnlocked(data.id);
        });

        socket.on('TASK_LOCK_REJECTED', (data) => {
            toast.error(data.message || 'Task is being edited by another user.');
        });

        // ------ User events ------
        socket.on('USERS_UPDATED', (users) => {
            store.setConnectedUsers(users);
        });

        socket.on('USER_DISCONNECTED', (data) => {
            const lockMap = store.lockMap;
            lockMap.forEach((lock, taskId) => {
                if (lock.lockedBy === data.userId) {
                    store.onTaskUnlocked(taskId);
                }
            });
        });

        // ------ Error events ------
        socket.on('ERROR', (data) => {
            console.error('[Socket] Error:', data);
            toast.error(data.message || 'An error occurred');
        });

        // If socket is already connected (re-mount), manually trigger setup
        if (socket.connected) {
            store.setConnected(true);
            socket.emit('USER_JOIN', user);
            socket.emit('REQUEST_SYNC');
        }

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('TASKS_SYNC');
            socket.off('TASK_CREATED');
            socket.off('TASK_UPDATED');
            socket.off('TASK_MOVED');
            socket.off('TASK_DELETED');
            socket.off('CONFLICT_MOVE_REJECTED');
            socket.off('CONFLICT_UPDATE_REJECTED');
            socket.off('CONFLICT_DELETE_REJECTED');
            socket.off('TASK_LOCKED');
            socket.off('TASK_UNLOCKED');
            socket.off('TASK_LOCK_REJECTED');
            socket.off('USERS_UPDATED');
            socket.off('USER_DISCONNECTED');
            socket.off('ERROR');
            disconnectSocket();
        };
    }, [user.userId]);

    return <>{children}</>;
}
