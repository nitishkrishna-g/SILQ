'use client';

import React from 'react';
import { DEFAULT_USERS, loginAsUser } from '@/lib/userIdentity';
import { UserInfo } from '@/types';
import styles from './LoginPage.module.css';

interface LoginPageProps {
    onLogin: (user: UserInfo) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
    const handleSelect = (userId: string) => {
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
                    {DEFAULT_USERS.map((user) => (
                        <button
                            key={user.userId}
                            className={styles.userCard}
                            onClick={() => handleSelect(user.userId)}
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
                        </button>
                    ))}
                </div>

                <p className={styles.hint}>
                    Open multiple tabs to simulate multi-user collaboration
                </p>
            </div>
        </div>
    );
}
