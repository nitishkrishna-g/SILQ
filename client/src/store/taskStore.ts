'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Task, TaskStatus, QueuedAction, UserInfo, LockInfo, HistoryLog } from '@/types';
import { getSocket } from '@/lib/socket';
import { generateKeyBetween, generateKeyAfter, generateKeyBefore } from '@/lib/fractional';
import { v4 as uuidv4 } from 'uuid';

interface TaskStore {
    // State
    tasks: Task[];
    isConnected: boolean;
    offlineQueue: QueuedAction[];
    connectedUsers: UserInfo[];
    lockMap: Map<string, LockInfo>;
    historyLogs: HistoryLog[];
    currentUser: UserInfo | null;
    logout: (() => void) | null;

    // Actions
    setTasks: (tasks: Task[]) => void;
    setConnected: (connected: boolean) => void;
    setCurrentUser: (user: UserInfo) => void;
    setConnectedUsers: (users: UserInfo[]) => void;

    // Task CRUD (optimistic)
    createTask: (title: string, description: string | null, status?: TaskStatus) => void;
    updateTask: (id: string, title?: string, description?: string | null) => void;
    moveTask: (id: string, newStatus: TaskStatus, newOrderKey: string) => void;
    deleteTask: (id: string) => void;

    // Server reconciliation
    onTaskCreated: (task: Task) => void;
    onTaskUpdated: (task: Task) => void;
    onTaskMoved: (task: Task) => void;
    onTaskDeleted: (id: string) => void;
    onTasksSync: (tasks: Task[]) => void;
    onHistorySync: (logs: HistoryLog[]) => void;
    onHistoryAdded: (log: HistoryLog) => void;
    onConflictRejected: () => void;

    // Presence
    lockTask: (id: string) => void;
    unlockTask: (id: string) => void;
    onTaskLocked: (lockInfo: LockInfo) => void;
    onTaskUnlocked: (id: string) => void;

    // Offline queue
    addToQueue: (action: QueuedAction) => void;
    replayQueue: () => void;
    clearQueue: () => void;

    // Helpers
    getTasksByStatus: (status: TaskStatus) => Task[];
    isForcedOffline: boolean;
    toggleForcedOffline: () => void;
    getOrderKeyForPosition: (status: TaskStatus, index: number) => string;
}

export const useTaskStore = create<TaskStore>()(
    persist(
        (set, get) => ({
            tasks: [],
            isConnected: false,
            offlineQueue: [],
            connectedUsers: [],
            lockMap: new Map(),
            historyLogs: [],
            currentUser: null,
            logout: null,
            isForcedOffline: false,

            setTasks: (tasks) => set({ tasks }),
            setConnected: (connected) => set({ isConnected: connected }),
            setCurrentUser: (user) => set({ currentUser: user }),
            setConnectedUsers: (users) => set({ connectedUsers: users }),

            toggleForcedOffline: () => set((state) => ({ isForcedOffline: !state.isForcedOffline })),

            // ---- Task CRUD with optimistic updates ----

            createTask: (title, description, status = 'TODO') => {
                const state = get();
                if (!state.currentUser) return;

                const payload = {
                    title,
                    description,
                    status,
                    userId: state.currentUser.userId,
                    username: state.currentUser.username
                };
                const socket = getSocket();

                if (state.isConnected) {
                    socket.emit('TASK_CREATE', payload);
                } else {
                    // For offline mode, add optimistic task
                    const columTasks = state.getTasksByStatus(status);
                    const lastTask = columTasks[columTasks.length - 1];
                    const orderKey = lastTask ? generateKeyAfter(lastTask.orderKey) : 'V';

                    const optimisticTask: Task = {
                        id: uuidv4(),
                        title,
                        description,
                        status,
                        orderKey,
                        version: 1,
                        lockedBy: null,
                        lastModifiedBy: state.currentUser.username,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    set({ tasks: [...state.tasks, optimisticTask] });
                    state.addToQueue({
                        id: uuidv4(),
                        type: 'TASK_CREATE',
                        payload,
                        timestamp: Date.now(),
                    });
                }
            },

            updateTask: (id, title, description) => {
                const state = get();
                if (!state.currentUser) return;
                const task = state.tasks.find((t) => t.id === id);
                if (!task) return;

                // Optimistic update
                const updatedTasks = state.tasks.map((t) => {
                    if (t.id === id) {
                        return {
                            ...t,
                            title: title ?? t.title,
                            description: description !== undefined ? description : t.description,
                            version: t.version, // Keep same version for optimistic; server will increment
                            lastModifiedBy: state.currentUser!.username,
                        };
                    }
                    return t;
                });
                set({ tasks: updatedTasks });

                const payload: Record<string, unknown> = {
                    id,
                    version: task.version,
                    userId: state.currentUser.userId,
                    username: state.currentUser.username
                };
                if (title !== undefined) payload.title = title;
                if (description !== undefined) payload.description = description;

                const socket = getSocket();
                if (state.isConnected) {
                    socket.emit('TASK_UPDATE', payload);
                } else {
                    state.addToQueue({
                        id: uuidv4(),
                        type: 'TASK_UPDATE',
                        payload,
                        timestamp: Date.now(),
                    });
                }
            },

            moveTask: (id, newStatus, newOrderKey) => {
                const state = get();
                if (!state.currentUser) return;
                const task = state.tasks.find((t) => t.id === id);
                if (!task) return;

                // Optimistic update
                const updatedTasks = state.tasks.map((t) => {
                    if (t.id === id) {
                        return {
                            ...t,
                            status: newStatus,
                            orderKey: newOrderKey,
                            lastModifiedBy: state.currentUser!.username
                        };
                    }
                    return t;
                });
                set({ tasks: updatedTasks });

                const payload = {
                    id,
                    status: newStatus,
                    orderKey: newOrderKey,
                    version: task.version,
                    userId: state.currentUser.userId,
                    username: state.currentUser.username
                };
                const socket = getSocket();

                if (state.isConnected) {
                    socket.emit('TASK_MOVE', payload);
                } else {
                    state.addToQueue({
                        id: uuidv4(),
                        type: 'TASK_MOVE',
                        payload,
                        timestamp: Date.now(),
                    });
                }
            },

            deleteTask: (id) => {
                const state = get();
                if (!state.currentUser) return;
                const task = state.tasks.find((t) => t.id === id);
                if (!task) return;

                // Optimistic update
                set({ tasks: state.tasks.filter((t) => t.id !== id) });

                const payload = {
                    id,
                    version: task.version,
                    userId: state.currentUser.userId,
                    username: state.currentUser.username
                };
                const socket = getSocket();

                if (state.isConnected) {
                    socket.emit('TASK_DELETE', payload);
                } else {
                    state.addToQueue({
                        id: uuidv4(),
                        type: 'TASK_DELETE',
                        payload,
                        timestamp: Date.now(),
                    });
                }
            },

            // ---- Server reconciliation ----

            onTaskCreated: (task) => {
                set((state) => {
                    // Check if already exists (dedup)
                    if (state.tasks.some((t) => t.id === task.id)) {
                        return { tasks: state.tasks.map((t) => (t.id === task.id ? task : t)) };
                    }
                    return { tasks: [...state.tasks, task] };
                });
            },

            onTaskUpdated: (task) => {
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
                }));
            },

            onTaskMoved: (task) => {
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
                }));
            },

            onTaskDeleted: (id) => {
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                }));
            },

            onTasksSync: (tasks) => {
                set((state) => {
                    // Rebuild the lockMap based on the actual DB state
                    const newLockMap = new Map<string, LockInfo>();
                    tasks.forEach((task) => {
                        if (task.lockedBy) {
                            // Try to preserve color if it already exists, or assign default
                            const existingLock = state.lockMap.get(task.id);
                            const userColor = state.connectedUsers.find(u => u.userId === task.lockedBy)?.color || existingLock?.color || '#6366f1';

                            newLockMap.set(task.id, {
                                id: task.id,
                                lockedBy: task.lockedBy,
                                color: userColor
                            });
                        }
                    });

                    return { tasks, lockMap: newLockMap };
                });
            },

            onHistorySync: (logs) => {
                set({ historyLogs: logs });
            },

            onHistoryAdded: (log) => {
                set((state) => ({
                    // Keep most recent 100 on the front-end to avoid memory bloat
                    historyLogs: [log, ...state.historyLogs].slice(0, 100),
                }));
            },

            onConflictRejected: () => {
                // Re-sync from server
                const socket = getSocket();
                socket.emit('REQUEST_SYNC');
            },

            // ---- Presence ----

            lockTask: (id) => {
                const state = get();
                if (!state.currentUser) return;
                const socket = getSocket();
                socket.emit('TASK_LOCK', { id, userId: state.currentUser.userId });
            },

            unlockTask: (id) => {
                const state = get();
                if (!state.currentUser) return;
                const socket = getSocket();
                socket.emit('TASK_UNLOCK', { id, userId: state.currentUser.userId });
            },

            onTaskLocked: (lockInfo) => {
                set((state) => {
                    const newMap = new Map(state.lockMap);
                    newMap.set(lockInfo.id, lockInfo);
                    return { lockMap: newMap };
                });
            },

            onTaskUnlocked: (id) => {
                set((state) => {
                    const newMap = new Map(state.lockMap);
                    newMap.delete(id);
                    return { lockMap: newMap };
                });
            },

            // ---- Offline queue ----

            addToQueue: (action) => {
                set((state) => ({ offlineQueue: [...state.offlineQueue, action] }));
            },

            replayQueue: () => {
                const state = get();
                const socket = getSocket();
                const queue = [...state.offlineQueue];
                set({ offlineQueue: [] });

                // Replay sequentially
                queue.forEach((action) => {
                    try {
                        socket.emit(action.type, action.payload);
                    } catch (error) {
                        console.error(`[Store] Failed to replay action ${action.type}:`, error);
                    }
                });
            },

            clearQueue: () => set({ offlineQueue: [] }),

            // ---- Helpers ----

            getTasksByStatus: (status) => {
                return get()
                    .tasks.filter((t) => t.status === status)
                    .sort((a, b) => a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0);
            },

            getOrderKeyForPosition: (status, index) => {
                const columnTasks = get().getTasksByStatus(status);

                if (columnTasks.length === 0) return 'V';
                if (index === 0) {
                    return generateKeyBefore(columnTasks[0].orderKey);
                }
                if (index >= columnTasks.length) {
                    return generateKeyAfter(columnTasks[columnTasks.length - 1].orderKey);
                }
                return generateKeyBetween(columnTasks[index - 1].orderKey, columnTasks[index].orderKey);
            },
        }),
        {
            name: 'kanban-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                tasks: state.tasks,
                offlineQueue: state.offlineQueue,
                currentUser: state.currentUser,
            }),
        }
    )
);
