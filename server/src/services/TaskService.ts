import { PrismaClient, Status, Task, HistoryLog } from '@prisma/client';
import { generateKeyBetween, generateKeyAfter } from '../lib/fractional';
import { historyService } from './HistoryService';
import {
    CreateTaskInput,
    UpdateTaskInput,
    MoveTaskInput,
    DeleteTaskInput,
    LockTaskInput,
    UnlockTaskInput,
} from '../validation/schemas';

const prisma = new PrismaClient();

export class TaskService {
    /**
     * Get all tasks, sorted by orderKey within each status column
     */
    async getAllTasks(): Promise<Task[]> {
        return prisma.task.findMany({
            orderBy: [{ status: 'asc' }, { orderKey: 'asc' }],
        });
    }

    /**
     * Create a new task.
     * Assigns an orderKey at the bottom of the target column.
     */
    async createTask(input: CreateTaskInput): Promise<{ task: Task; log: HistoryLog }> {
        const status = input.status || 'TODO';

        // Find the last task in this column to generate an orderKey after it
        const lastTask = await prisma.task.findFirst({
            where: { status: status as Status },
            orderBy: { orderKey: 'desc' },
        });

        const orderKey = lastTask
            ? generateKeyAfter(lastTask.orderKey)
            : 'V'; // First task in column gets midpoint

        const task = await prisma.task.create({
            data: {
                title: input.title,
                description: input.description || null,
                status: status as Status,
                orderKey,
                lastModifiedBy: input.username,
            },
        });

        const log = await historyService.addLog({
            action: 'CREATE',
            taskId: task.id,
            taskTitle: task.title,
            userId: input.userId,
        });

        return { task, log };
    }

    /**
     * Update task fields (title, description).
     * Uses OCC: only updates if version matches.
     * Updates specific fields only — never replaces the whole document.
     */
    async updateTask(input: UpdateTaskInput): Promise<{ task: Task | null; conflict: boolean; log?: HistoryLog }> {
        const { id, version, ...fields } = input;

        // Build dynamic update data with only provided fields
        const updateData: Record<string, unknown> = {};
        if (fields.title !== undefined) updateData.title = fields.title;
        if (fields.description !== undefined) updateData.description = fields.description;

        try {
            const task = await prisma.task.updateMany({
                where: { id, version },
                data: {
                    ...updateData,
                    lastModifiedBy: input.username,
                    version: { increment: 1 },
                },
            });

            if (task.count === 0) {
                return { task: null, conflict: true };
            }

            const updated = await prisma.task.findUnique({ where: { id } });

            const log = await historyService.logActionAndUpdateTask({
                action: 'UPDATE',
                taskId: updated!.id,
                taskTitle: updated!.title,
                userId: input.userId,
                details: 'Updated task details',
            });

            return { task: updated, conflict: false, log };
        } catch (error) {
            return { task: null, conflict: true };
        }
    }

    /**
     * Move a task to a different column and/or new position.
     * Uses OCC via version field.
     */
    async moveTask(input: MoveTaskInput): Promise<{ task: Task | null; conflict: boolean; log?: HistoryLog }> {
        const { id, status, orderKey, version } = input;

        try {
            const result = await prisma.task.updateMany({
                where: { id, version },
                data: {
                    status: status as Status,
                    orderKey,
                    lastModifiedBy: input.username,
                    version: { increment: 1 },
                },
            });

            if (result.count === 0) {
                return { task: null, conflict: true };
            }

            const updated = await prisma.task.findUnique({ where: { id } });

            const log = await historyService.logActionAndUpdateTask({
                action: 'MOVE',
                taskId: updated!.id,
                taskTitle: updated!.title,
                userId: input.userId,
                details: `Moved to ${status}`,
            });

            return { task: updated, conflict: false, log };
        } catch (error) {
            return { task: null, conflict: true };
        }
    }

    /**
     * Delete a task. Uses version check for OCC.
     */
    async deleteTask(input: DeleteTaskInput): Promise<{ success: boolean; conflict: boolean; log?: HistoryLog }> {
        const { id, version } = input;

        try {
            const task = await prisma.task.findUnique({ where: { id } });
            if (!task) return { success: false, conflict: true };

            const result = await prisma.task.deleteMany({
                where: { id, version },
            });

            if (result.count === 0) {
                return { success: false, conflict: true };
            }

            const log = await historyService.addLog({
                action: 'DELETE',
                taskId: id,
                taskTitle: task.title,
                userId: input.userId,
            });

            return { success: true, conflict: false, log };
        } catch (error) {
            return { success: false, conflict: true };
        }
    }

    /**
     * Lock a task for editing by a specific user.
     * Only locks if not already locked by someone else.
     */
    async lockTask(input: LockTaskInput): Promise<{ task: Task | null; alreadyLocked: boolean }> {
        const { id, userId } = input;

        // Check current lock state
        const current = await prisma.task.findUnique({ where: { id } });
        if (!current) return { task: null, alreadyLocked: false };

        if (current.lockedBy && current.lockedBy !== userId) {
            return { task: current, alreadyLocked: true };
        }

        const task = await prisma.task.update({
            where: { id },
            data: { lockedBy: userId },
        });

        return { task, alreadyLocked: false };
    }

    /**
     * Unlock a task. Only the user who locked it can unlock it.
     */
    async unlockTask(input: UnlockTaskInput): Promise<Task | null> {
        const { id, userId } = input;

        const current = await prisma.task.findUnique({ where: { id } });
        if (!current || (current.lockedBy && current.lockedBy !== userId)) {
            return null;
        }

        return prisma.task.update({
            where: { id },
            data: { lockedBy: null },
        });
    }

    /**
     * Unlock all tasks locked by a specific user (e.g., on disconnect)
     */
    async unlockAllByUser(userId: string): Promise<void> {
        await prisma.task.updateMany({
            where: { lockedBy: userId },
            data: { lockedBy: null },
        });
    }
}

export const taskService = new TaskService();
