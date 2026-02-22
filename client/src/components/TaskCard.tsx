'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '@/types';
import { useTaskStore } from '@/store/taskStore';
import styles from './TaskCard.module.css';

interface TaskCardProps {
    task: Task;
    index: number;
}

export default function TaskCard({ task, index }: TaskCardProps) {
    const { updateTask, deleteTask, lockTask, unlockTask, lockMap, currentUser } = useTaskStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDescription, setEditDescription] = useState(task.description || '');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const lockInfo = lockMap.get(task.id);
    const isLockedByOther = lockInfo && lockInfo.lockedBy !== currentUser?.userId;
    const isLockedByMe = lockInfo && lockInfo.lockedBy === currentUser?.userId;

    useEffect(() => {
        if (isEditing && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isEditing]);

    // Update local state when task changes from server
    useEffect(() => {
        if (!isEditing) {
            const timer = setTimeout(() => {
                setEditTitle(task.title);
                setEditDescription(task.description || '');
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [task.title, task.description, isEditing]);

    const handleStartEdit = () => {
        if (isLockedByOther) return;
        setIsEditing(true);
        lockTask(task.id);
    };

    const handleSave = () => {
        const titleChanged = editTitle.trim() !== task.title;
        const descChanged = editDescription.trim() !== (task.description || '');

        if (editTitle.trim() && (titleChanged || descChanged)) {
            updateTask(
                task.id,
                titleChanged ? editTitle.trim() : undefined,
                descChanged ? editDescription.trim() || null : undefined
            );
        } else {
            setEditTitle(task.title);
            setEditDescription(task.description || '');
        }

        setIsEditing(false);
        unlockTask(task.id);
    };

    const handleCancel = () => {
        setEditTitle(task.title);
        setEditDescription(task.description || '');
        setIsEditing(false);
        unlockTask(task.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        deleteTask(task.id);
    };

    // Prevent drag system from capturing clicks on interactive elements
    const stopDrag = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const statusClass =
        task.status === 'TODO' ? styles.cardTodo :
            task.status === 'IN_PROGRESS' ? styles.cardInProgress :
                task.status === 'DONE' ? styles.cardDone : '';

    const spotlightColor =
        task.status === 'TODO' ? 'rgba(59, 130, 246, 0.15)' :
            task.status === 'IN_PROGRESS' ? 'rgba(251, 191, 36, 0.15)' :
                task.status === 'DONE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.1)';

    return (
        <Draggable draggableId={task.id} index={index} isDragDisabled={isLockedByOther || false}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${styles.card} ${statusClass} ${snapshot.isDragging ? styles.dragging : ''} ${isLockedByOther ? styles.locked : ''} ${isLockedByMe ? styles.lockedByMe : ''}`}
                    style={{
                        ...provided.draggableProps.style,
                        borderColor: lockInfo ? lockInfo.color : undefined,
                        borderWidth: lockInfo ? '2px' : undefined,
                    }}
                    onClick={() => !isEditing && !isLockedByOther && handleStartEdit()}
                    onMouseMove={handleMouseMove}
                >
                    <div
                        className={styles.spotlight}
                        style={{
                            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 40%)`
                        }}
                    />
                    <div className={styles.contentWrapper}>
                        {isEditing ? (
                            <div className={styles.editMode} onClick={stopDrag} onMouseDown={stopDrag}>
                                <input
                                    ref={titleInputRef}
                                    className={styles.editInput}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Task title..."
                                />
                                <textarea
                                    className={styles.editTextarea}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Description (optional)..."
                                    rows={2}
                                />
                                <div className={styles.editActions}>
                                    <button className={styles.saveBtn} onClick={handleSave} onMouseDown={stopDrag}>Save</button>
                                    <button className={styles.cancelBtn} onClick={handleCancel} onMouseDown={stopDrag}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>{task.title}</h3>
                                    {!isLockedByOther && (
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={handleDelete}
                                            onMouseDown={stopDrag}
                                            title="Delete task"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                {task.description && (
                                    <p className={styles.cardDescription}>{task.description}</p>
                                )}
                                <div className={styles.cardFooter}>
                                    <div className={styles.footerLeft}>
                                        <span className={styles.versionBadge}>v{task.version}</span>
                                        {task.lastModifiedBy && (
                                            <span className={styles.modifiedBy} title={`Last modified by ${task.lastModifiedBy}`}>
                                                Last modified by &quot;{task.lastModifiedBy}&quot;
                                            </span>
                                        )}
                                    </div>
                                    {isLockedByOther && (
                                        <span className={styles.lockIndicator} style={{ color: lockInfo?.color }}>
                                            🔒 {lockInfo?.lockedBy}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
}
