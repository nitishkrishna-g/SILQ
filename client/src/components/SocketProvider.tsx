'use client';

import React, { useEffect, useRef } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import { logoutUser } from '@/lib/userIdentity';
import { UserInfo, Task, HistoryLog, LockInfo } from '@/types';
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

    const isForcedOffline = useTaskStore((s) => s.isForcedOffline);

    // Toggle socket based on forced offline state
    useEffect(() => {
        if (isForcedOffline) {
            console.log('[Socket] Forced Offline enabled');
            disconnectSocket();
            store.setConnected(false);
        } else {
            console.log('[Socket] Forced Offline disabled, reconnecting...');
            connectSocket();
        }
    }, [isForcedOffline]);

    useEffect(() => {
        store.setCurrentUser(user);

        const socket = getSocket();

        // ------ Connection events ------
        const onConnect = () => {
            console.log('[Socket] Connected');
            store.setConnected(true);
            socket.emit('USER_JOIN', user);
            socket.emit('REQUEST_SYNC');

            if (store.offlineQueue.length > 0) {
                toast.success(`Replaying ${store.offlineQueue.length} offline action(s)...`);
                store.replayQueue();
            }
        };

        const onDisconnect = () => {
            console.log('[Socket] Disconnected');
            store.setConnected(false);
        };

        const onConnectError = (err: Error) => {
            console.warn('[Socket] Connection error:', err.message);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);

        // ------ Task events ------
        const onTasksSync = (tasks: Task[]) => store.onTasksSync(tasks);
        const onTaskCreated = (task: Task) => store.onTaskCreated(task);
        const onTaskUpdated = (task: Task) => store.onTaskUpdated(task);
        const onTaskMoved = (task: Task) => store.onTaskMoved(task);
        const onTaskDeleted = (data: { id: string }) => store.onTaskDeleted(data.id);
        const onHistorySync = (logs: HistoryLog[]) => store.onHistorySync(logs);
        const onHistoryAdded = (log: HistoryLog) => store.onHistoryAdded(log);

        socket.on('TASKS_SYNC', onTasksSync);
        socket.on('TASK_CREATED', onTaskCreated);
        socket.on('TASK_UPDATED', onTaskUpdated);
        socket.on('TASK_MOVED', onTaskMoved);
        socket.on('TASK_DELETED', onTaskDeleted);
        socket.on('HISTORY_SYNC', onHistorySync);
        socket.on('HISTORY_ADDED', onHistoryAdded);

        // ------ Conflict events ------
        const onConflictMove = (data: { id: string, message?: string }) => {
            toast.error(data.message || 'Move conflict: task was already moved by another user.');
            store.onConflictRejected();
        };
        const onConflictUpdate = (data: { id: string, message?: string }) => {
            toast.error(data.message || 'Update conflict: task was modified by another user.');
            store.onConflictRejected();
        };
        const onConflictDelete = (data: { id: string, message?: string }) => {
            toast.error(data.message || 'Delete conflict: task was modified before deletion.');
            store.onConflictRejected();
        };

        socket.on('CONFLICT_MOVE_REJECTED', onConflictMove);
        socket.on('CONFLICT_UPDATE_REJECTED', onConflictUpdate);
        socket.on('CONFLICT_DELETE_REJECTED', onConflictDelete);

        // ------ Presence events ------
        const onTaskLocked = (data: LockInfo) => store.onTaskLocked(data);
        const onTaskUnlocked = (data: { id: string }) => store.onTaskUnlocked(data.id);
        const onTaskLockRejected = (data: { message?: string }) => toast.error(data.message || 'Task is being edited by another user.');

        socket.on('TASK_LOCKED', onTaskLocked);
        socket.on('TASK_UNLOCKED', onTaskUnlocked);
        socket.on('TASK_LOCK_REJECTED', onTaskLockRejected);

        // ------ User events ------
        const onUsersUpdated = (users: UserInfo[]) => store.setConnectedUsers(users);
        const onUserDisconnected = (data: { userId: string }) => {
            const lockMap = useTaskStore.getState().lockMap;
            lockMap.forEach((lock, taskId) => {
                if (lock.lockedBy === data.userId) {
                    store.onTaskUnlocked(taskId);
                }
            });
        };

        socket.on('USERS_UPDATED', onUsersUpdated);
        socket.on('USER_DISCONNECTED', onUserDisconnected);

        // ------ Error events ------
        const onError = (data: { message?: string }) => {
            console.error('[Socket] Error:', data);
            toast.error(data.message || 'An error occurred');
        };
        socket.on('ERROR', onError);

        // Initial setup
        if (socket.connected) {
            onConnect();
        } else if (!isForcedOffline) {
            connectSocket();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('TASKS_SYNC', onTasksSync);
            socket.off('TASK_CREATED', onTaskCreated);
            socket.off('TASK_UPDATED', onTaskUpdated);
            socket.off('TASK_MOVED', onTaskMoved);
            socket.off('TASK_DELETED', onTaskDeleted);
            socket.off('HISTORY_SYNC', onHistorySync);
            socket.off('HISTORY_ADDED', onHistoryAdded);
            socket.off('CONFLICT_MOVE_REJECTED', onConflictMove);
            socket.off('CONFLICT_UPDATE_REJECTED', onConflictUpdate);
            socket.off('CONFLICT_DELETE_REJECTED', onConflictDelete);
            socket.off('TASK_LOCKED', onTaskLocked);
            socket.off('TASK_UNLOCKED', onTaskUnlocked);
            socket.off('TASK_LOCK_REJECTED', onTaskLockRejected);
            socket.off('USERS_UPDATED', onUsersUpdated);
            socket.off('USER_DISCONNECTED', onUserDisconnected);
            socket.off('ERROR', onError);
        };
    }, [user.userId, isForcedOffline]);

    return <>{children}</>;
}
