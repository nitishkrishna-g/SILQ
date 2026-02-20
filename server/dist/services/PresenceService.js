"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presenceService = void 0;
class PresenceService {
    constructor() {
        // Map userId -> PresenceInfo
        this.userPresence = new Map();
        // Map socketId -> userId
        this.socketToUser = new Map();
    }
    addUser(socketId, user) {
        this.socketToUser.set(socketId, user.userId);
        const existing = this.userPresence.get(user.userId);
        if (existing) {
            existing.socketIds.add(socketId);
        }
        else {
            this.userPresence.set(user.userId, {
                ...user,
                socketIds: new Set([socketId])
            });
        }
    }
    removeSocket(socketId) {
        const userId = this.socketToUser.get(socketId);
        if (!userId)
            return null;
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
    getConnectedUsers() {
        return Array.from(this.userPresence.values()).map(({ socketIds, ...user }) => user);
    }
    getUserBySocket(socketId) {
        const userId = this.socketToUser.get(socketId);
        if (!userId)
            return null;
        const presence = this.userPresence.get(userId);
        if (!presence)
            return null;
        const { socketIds, ...user } = presence;
        return user;
    }
}
exports.presenceService = new PresenceService();
//# sourceMappingURL=PresenceService.js.map