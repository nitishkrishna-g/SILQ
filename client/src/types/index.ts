export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    orderKey: string;
    version: number;
    lockedBy: string | null;
    lastModifiedBy: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface HistoryLog {
    id: string;
    action: string;
    taskId: string;
    taskTitle: string;
    userId: string;
    details: string | null;
    timestamp: string;
}

export interface UserInfo {
    userId: string;
    username: string;
    color: string;
}

export interface QueuedAction {
    id: string;
    type: 'TASK_CREATE' | 'TASK_UPDATE' | 'TASK_MOVE' | 'TASK_DELETE';
    payload: unknown;
    timestamp: number;
}

export interface LockInfo {
    id: string;
    lockedBy: string;
    color: string;
}

export const COLUMN_CONFIG: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'TODO', title: '📋 To Do', color: '#6366f1' },
    { id: 'IN_PROGRESS', title: '⚡ In Progress', color: '#f59e0b' },
    { id: 'DONE', title: '✅ Done', color: '#22c55e' },
];
