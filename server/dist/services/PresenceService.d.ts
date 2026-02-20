import { UserInfo } from '../types';
declare class PresenceService {
    private userPresence;
    private socketToUser;
    addUser(socketId: string, user: UserInfo): void;
    removeSocket(socketId: string): {
        userId: string;
        isLastSocket: boolean;
    } | null;
    getConnectedUsers(): UserInfo[];
    getUserBySocket(socketId: string): UserInfo | null;
}
export declare const presenceService: PresenceService;
export {};
//# sourceMappingURL=PresenceService.d.ts.map