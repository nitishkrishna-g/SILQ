import { PrismaClient, HistoryLog } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateLogInput {
    action: string;
    taskId: string;
    taskTitle: string;
    userId: string;
    details?: string;
}

export class HistoryService {
    /**
     * Get the most recent history logs.
     * @param limit maximum number of logs to return.
     */
    async getRecentLogs(limit: number = 50): Promise<HistoryLog[]> {
        return prisma.historyLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }

    /**
     * Add a new history log entry.
     */
    async addLog(input: CreateLogInput): Promise<HistoryLog> {
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
    async logActionAndUpdateTask(input: CreateLogInput): Promise<HistoryLog> {
        const log = await this.addLog(input);

        // As long as it's not a deletion log, we should update who modified it last.
        if (input.action !== 'DELETE') {
            try {
                await prisma.task.update({
                    where: { id: input.taskId },
                    data: { lastModifiedBy: input.userId },
                });
            } catch (error) {
                console.error('[HistoryService] Failed to update lastModifiedBy:', error);
            }
        }

        return log;
    }
}

export const historyService = new HistoryService();
