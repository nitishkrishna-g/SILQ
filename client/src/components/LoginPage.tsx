'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_USERS, loginAsUser } from '@/lib/userIdentity';
import { UserInfo } from '@/types';
import styles from './LoginPage.module.css';
import { API_URL } from '@/lib/socket';

interface LoginPageProps {
    onLogin: (user: UserInfo) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        let mounted = true;

        const fetchOnlineUsers = async () => {
            try {
                const res = await fetch(`${API_URL}/users/online`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.success && mounted) {
                    const ids = new Set(data.users.map((u: UserInfo) => u.userId));
                    setActiveUserIds(ids as Set<string>);
                }
            } catch {
                // Silently fail if server isn't reachable yet
            }
        };

        // Fetch immediately, then poll every 3 seconds
        fetchOnlineUsers();
        const interval = setInterval(fetchOnlineUsers, 3000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleSelect = (userId: string) => {
        if (activeUserIds.has(userId)) return; // Double protection
        const user = loginAsUser(userId);
        if (user) onLogin(user);
    };

    return (
        <div className={styles.wrapper}>
            {/* Floating orbs */}
            <div className={`${styles.orb} ${styles.orb1}`} />
            <div className={`${styles.orb} ${styles.orb2}`} />
            <div className={`${styles.orb} ${styles.orb3}`} />

            <div className={styles.content}>
                <h1 className={styles.logo}>
                    <span className={styles.logoIcon}>◆</span>
                    Collaborative Board
                </h1>
                <p className={styles.subtitle}>
                    Choose your account to start collaborating in real-time
                </p>

                <div className={styles.usersGrid}>
                    {DEFAULT_USERS.map((user) => {
                        const isOnline = activeUserIds.has(user.userId);
                        return (
                            <button
                                key={user.userId}
                                className={`${styles.userCard} ${isOnline ? styles.disabledCard : ''}`}
                                onClick={() => handleSelect(user.userId)}
                                disabled={isOnline}
                                title={isOnline ? `${user.username} is already on the board` : `Log in as ${user.username}`}
                                style={{
                                    // Subtle color tint on hover via CSS variable
                                    ['--card-accent' as string]: user.color,
                                }}
                            >
                                <div
                                    className={styles.avatar}
                                    style={{ backgroundColor: user.color }}
                                >
                                    {user.username.charAt(0)}
                                </div>
                                <span className={styles.userName}>{user.username}</span>
                                {isOnline && <span className={styles.onlineBadge}>Online</span>}
                            </button>
                        );
                    })}
                </div>

                <p className={styles.hint}>
                    Open multiple tabs to simulate multi-user collaboration
                </p>
            </div>
        </div>
    );
}
