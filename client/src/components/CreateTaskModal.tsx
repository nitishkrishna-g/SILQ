'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { TaskStatus } from '@/types';
import styles from './CreateTaskModal.module.css';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultStatus?: TaskStatus;
}

export default function CreateTaskModal({ isOpen, onClose, defaultStatus = 'TODO' }: CreateTaskModalProps) {
    const { createTask } = useTaskStore();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TaskStatus>(defaultStatus);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && titleRef.current) {
            titleRef.current.focus();
            setStatus(defaultStatus);
        }
    }, [isOpen, defaultStatus]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        createTask(title.trim(), description.trim() || null, status);
        setTitle('');
        setDescription('');
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose} onKeyDown={handleKeyDown}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Create New Task</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className={styles.label}>Title *</label>
                        <input
                            ref={titleRef}
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Description</label>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details (optional)..."
                            rows={3}
                            maxLength={2000}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Column</label>
                        <select
                            className={styles.select}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as TaskStatus)}
                        >
                            <option value="TODO">📋 To Do</option>
                            <option value="IN_PROGRESS">⚡ In Progress</option>
                            <option value="DONE">✅ Done</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.createBtn} disabled={!title.trim()}>
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
