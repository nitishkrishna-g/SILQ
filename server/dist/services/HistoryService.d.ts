import { HistoryLog } from '@prisma/client';
export interface CreateLogInput {
    action: string;
    taskId: string;
    taskTitle: string;
    userId: string;
    details?: string;
}
export declare class HistoryService {
    /**
     * Get the most recent history logs.
     * @param limit maximum number of logs to return.
     */
    getRecentLogs(limit?: number): Promise<HistoryLog[]>;
    /**
     * Add a new history log entry.
     */
    addLog(input: CreateLogInput): Promise<HistoryLog>;
    /**
     * Add a log and implicitly update the lastModifiedBy field on the task.
     * This ensures the two actions happen atomically enough for our purposes.
     */
    logActionAndUpdateTask(input: CreateLogInput): Promise<HistoryLog>;
}
export declare const historyService: HistoryService;
//# sourceMappingURL=HistoryService.d.ts.map