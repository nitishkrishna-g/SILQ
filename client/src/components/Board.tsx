'use client';

import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useTaskStore } from '@/store/taskStore';
import { Task, TaskStatus, COLUMN_CONFIG } from '@/types';
import { generateKeyBefore, generateKeyAfter, generateKeyBetween } from '@/lib/fractional';
import { DEFAULT_USERS } from '@/lib/userIdentity';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import styles from './Board.module.css';

function getColumnTasks(tasks: Task[], status: TaskStatus): Task[] {
    return tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.orderKey.localeCompare(b.orderKey));
}

export default function Board() {
    const tasks = useTaskStore((s) => s.tasks);
    const isConnected = useTaskStore((s) => s.isConnected);
    const connectedUsers = useTaskStore((s) => s.connectedUsers);
    const currentUser = useTaskStore((s) => s.currentUser);
    const offlineQueue = useTaskStore((s) => s.offlineQueue);
    const moveTask = useTaskStore((s) => s.moveTask);
    const logout = useTaskStore((s) => s.logout);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createColumnDefault, setCreateColumnDefault] = useState<TaskStatus>('TODO');

    // Derive column tasks reactively from the tasks array
    const columnTasksMap = useMemo(() => {
        const map: Record<TaskStatus, Task[]> = {
            TODO: getColumnTasks(tasks, 'TODO'),
            IN_PROGRESS: getColumnTasks(tasks, 'IN_PROGRESS'),
            DONE: getColumnTasks(tasks, 'DONE'),
        };
        return map;
    }, [tasks]);

    // Track which users are online
    const onlineUserIds = useMemo(
        () => new Set(connectedUsers.map((u) => u.userId)),
        [connectedUsers]
    );
    const onlineCount = onlineUserIds.size;

    const handleDragEnd = (result: DropResult) => {
        const { draggableId, source, destination } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newStatus = destination.droppableId as TaskStatus;
        const task = tasks.find((t) => t.id === draggableId);
        if (!task) return;

        const destColumnTasks = columnTasksMap[newStatus].filter((t) => t.id !== draggableId);

        let newOrderKey: string;
        if (destColumnTasks.length === 0) {
            newOrderKey = 'V';
        } else if (destination.index === 0) {
            newOrderKey = generateKeyBefore(destColumnTasks[0].orderKey);
        } else if (destination.index >= destColumnTasks.length) {
            newOrderKey = generateKeyAfter(destColumnTasks[destColumnTasks.length - 1].orderKey);
        } else {
            newOrderKey = generateKeyBetween(
                destColumnTasks[destination.index - 1].orderKey,
                destColumnTasks[destination.index].orderKey
            );
        }

        moveTask(draggableId, newStatus, newOrderKey);
    };

    const handleAddTask = (status: TaskStatus) => {
        setCreateColumnDefault(status);
        setShowCreateModal(true);
    };

    return (
        <div className={styles.wrapper}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.logo}>
                        <span className={styles.logoIcon}>◆</span>
                        Collaborative Board
                    </h1>
                    <div className={styles.connectionStatus}>
                        <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
                        <span className={styles.statusText}>
                            {isConnected ? 'Connected' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    {/* All 5 users with online/offline indicators */}
                    <div className={styles.usersGroup}>
                        {DEFAULT_USERS.map((u) => {
                            const isOnline = onlineUserIds.has(u.userId);
                            const isMe = currentUser?.userId === u.userId;
                            return (
                                <div
                                    key={u.userId}
                                    className={`${styles.userAvatar} ${isOnline ? '' : styles.userOffline} ${isMe ? styles.userMe : ''}`}
                                    style={{ backgroundColor: u.color }}
                                    title={`${u.username}${isOnline ? ' (online)' : ' (offline)'}${isMe ? ' — you' : ''}`}
                                >
                                    {u.username.charAt(0)}
                                    <span className={`${styles.presenceDot} ${isOnline ? styles.presenceOnline : styles.presenceOffline}`} />
                                </div>
                            );
                        })}
                        <span className={styles.userCount}>{onlineCount} online</span>
                    </div>

                    {/* Current user + logout */}
                    {currentUser && (
                        <div className={styles.currentUser}>
                            <span className={styles.currentUsername}>{currentUser.username}</span>
                            <button className={styles.logoutBtn} onClick={() => logout?.()} title="Sign out">
                                ↗
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Offline Banner */}
            {!isConnected && (
                <div className={styles.offlineBanner}>
                    <span className={styles.offlineIcon}>⚠</span>
                    Reconnecting… Offline Mode
                    {offlineQueue.length > 0 && (
                        <span className={styles.queueCount}>({offlineQueue.length} queued)</span>
                    )}
                </div>
            )}

            {/* Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className={styles.board}>
                    {COLUMN_CONFIG.map((col) => {
                        const columnTasks = columnTasksMap[col.id];
                        return (
                            <div key={col.id} className={styles.column}>
                                <div className={styles.columnHeader}>
                                    <div className={styles.columnTitleGroup}>
                                        <div className={styles.columnAccent} style={{ backgroundColor: col.color }} />
                                        <h2 className={styles.columnTitle}>{col.title}</h2>
                                        <span className={styles.taskCount}>{columnTasks.length}</span>
                                    </div>
                                    <button
                                        className={styles.addBtn}
                                        onClick={() => handleAddTask(col.id)}
                                        title={`Add task to ${col.title}`}
                                    >
                                        +
                                    </button>
                                </div>

                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`${styles.columnBody} ${snapshot.isDraggingOver ? styles.dropTarget : ''}`}
                                        >
                                            {columnTasks.map((task, index) => (
                                                <TaskCard key={task.id} task={task} index={index} />
                                            ))}
                                            {provided.placeholder}
                                            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                                                <div className={styles.emptyColumn}>
                                                    <span className={styles.emptyIcon}>📝</span>
                                                    <span>No tasks yet</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                defaultStatus={createColumnDefault}
            />
        </div>
    );
}
