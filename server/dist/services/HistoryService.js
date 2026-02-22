"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyService = exports.HistoryService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class HistoryService {
    /**
     * Get the most recent history logs.
     * @param limit maximum number of logs to return.
     */
    async getRecentLogs(limit = 50) {
        return prisma.historyLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }
    /**
     * Add a new history log entry.
     */
    async addLog(input) {
        return prisma.historyLog.create({
            data: {
                action: input.action,
                taskId: input.taskId,
                taskTitle: input.taskTitle,
                userId: input.userId,
                details: input.details,
            },
        });
    }
    /**
     * Add a log and implicitly update the lastModifiedBy field on the task.
     * This ensures the two actions happen atomically enough for our purposes.
     */
    async logActionAndUpdateTask(input) {
        const log = await this.addLog(input);
        // As long as it's not a deletion log, we should update who modified it last.
        if (input.action !== 'DELETE') {
            try {
                await prisma.task.update({
                    where: { id: input.taskId },
                    data: { lastModifiedBy: input.userId },
                });
            }
            catch (error) {
                console.error('[HistoryService] Failed to update lastModifiedBy:', error);
            }
        }
        return log;
    }
}
exports.HistoryService = HistoryService;
exports.historyService = new HistoryService();
//# sourceMappingURL=HistoryService.js.map