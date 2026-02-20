import { UserInfo } from '../types';

interface PresenceInfo extends UserInfo {
    socketIds: Set<string>;
}

class PresenceService {
    // Map userId -> PresenceInfo
    private userPresence = new Map<string, PresenceInfo>();
    // Map socketId -> userId
    private socketToUser = new Map<string, string>();

    addUser(socketId: string, user: UserInfo): void {
        this.socketToUser.set(socketId, user.userId);

        const existing = this.userPresence.get(user.userId);
        if (existing) {
            existing.socketIds.add(socketId);
        } else {
            this.userPresence.set(user.userId, {
                ...user,
                socketIds: new Set([socketId])
            });
        }
    }

    removeSocket(socketId: string): { userId: string, isLastSocket: boolean } | null {
        const userId = this.socketToUser.get(socketId);
        if (!userId) return null;

        this.socketToUser.delete(socketId);
        const presence = this.userPresence.get(userId);

        if (presence) {
            presence.socketIds.delete(socketId);
            const isLastSocket = presence.socketIds.size === 0;
            if (isLastSocket) {
                this.userPresence.delete(userId);
            }
            return { userId, isLastSocket };
        }

        return null;
    }

    getConnectedUsers(): UserInfo[] {
        return Array.from(this.userPresence.values()).map(({ socketIds, ...user }) => user as UserInfo);
    }

    getUserBySocket(socketId: string): UserInfo | null {
        const userId = this.socketToUser.get(socketId);
        if (!userId) return null;
        const presence = this.userPresence.get(userId);
        if (!presence) return null;
        const { socketIds, ...user } = presence;
        return user as UserInfo;
    }
}

export const presenceService = new PresenceService();
