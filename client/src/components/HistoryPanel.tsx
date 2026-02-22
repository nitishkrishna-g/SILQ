'use client';

import React, { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import styles from './HistoryPanel.module.css';

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const getActionVerb = (action: string) => {
    switch (action) {
        case 'CREATE': return 'created';
        case 'UPDATE': return 'updated';
        case 'MOVE': return 'moved';
        case 'DELETE': return 'deleted';
        default: return action.toLowerCase();
    }
};

const getActionColor = (action: string) => {
    switch (action) {
        case 'CREATE': return 'var(--success, #22c55e)';
        case 'UPDATE': return 'var(--accent, #6366f1)';
        case 'MOVE': return 'var(--warning, #f59e0b)';
        case 'DELETE': return 'var(--danger, #ef4444)';
        default: return 'var(--text-secondary)';
    }
};

export default function HistoryPanel({ isOpen, onClose }: HistoryPanelProps) {
    const historyLogs = useTaskStore((s) => s.historyLogs);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    if (!isOpen || !mounted) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <h2>Activity History</h2>
                    <button className={styles.closeBtn} onClick={onClose} title="Close Panel">✕</button>
                </div>

                <div className={styles.content}>
                    {historyLogs.length === 0 ? (
                        <div className={styles.empty}>No recent activity yet.</div>
                    ) : (
                        <div className={styles.timeline}>
                            {historyLogs.map((log) => (
                                <div key={log.id} className={styles.logItem}>
                                    <div className={styles.logIcon} style={{ backgroundColor: getActionColor(log.action) }} />
                                    <div className={styles.logContent}>
                                        <div className={styles.logHeader}>
                                            <span className={styles.logUser}>{log.userId}</span>
                                            <span className={styles.logAction}>{getActionVerb(log.action)}</span>
                                            <span className={styles.logTaskTitle}>&quot;{log.taskTitle}&quot;</span>
                                        </div>
                                        {log.details && <div className={styles.logDetails}>{log.details}</div>}
                                        <div className={styles.logTime}>
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
