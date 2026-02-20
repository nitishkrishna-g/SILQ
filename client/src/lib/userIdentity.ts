import { UserInfo } from '@/types';

export const DEFAULT_USERS: UserInfo[] = [
    { userId: 'alice', username: 'Alice', color: '#6366f1' },
    { userId: 'bob', username: 'Bob', color: '#ec4899' },
    { userId: 'charlie', username: 'Charlie', color: '#14b8a6' },
    { userId: 'dennis', username: 'Dennis', color: '#f59e0b' },
    { userId: 'emma', username: 'Emma', color: '#8b5cf6' },
];

const STORAGE_KEY = 'kanban_user';

export function getUserById(userId: string): UserInfo | undefined {
    return DEFAULT_USERS.find((u) => u.userId === userId);
}

/** Returns the currently logged-in user, or null if not logged in. */
export function getLoggedInUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
        const parsed = JSON.parse(stored) as UserInfo;
        // Validate it's one of the 5 known users
        const match = getUserById(parsed.userId);
        return match ?? null;
    } catch {
        return null;
    }
}

/** Log in as a specific user (persists to localStorage). */
export function loginAsUser(userId: string): UserInfo | null {
    const user = getUserById(userId);
    if (!user) return null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
}

/** Log out (clears localStorage). */
export function logoutUser(): void {
    localStorage.removeItem(STORAGE_KEY);
}
