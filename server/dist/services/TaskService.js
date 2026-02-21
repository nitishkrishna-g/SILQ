"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = exports.TaskService = void 0;
const client_1 = require("@prisma/client");
const fractional_1 = require("../lib/fractional");
const HistoryService_1 = require("./HistoryService");
const prisma = new client_1.PrismaClient();
class TaskService {
    /**
     * Get all tasks, sorted by orderKey within each status column
     */
    async getAllTasks() {
        return prisma.task.findMany({
            orderBy: [{ status: 'asc' }, { orderKey: 'asc' }],
        });
    }
    /**
     * Create a new task.
     * Assigns an orderKey at the bottom of the target column.
     */
    async createTask(input) {
        const status = input.status || 'TODO';
        // Find the last task in this column to generate an orderKey after it
        const lastTask = await prisma.task.findFirst({
            where: { status: status },
            orderBy: { orderKey: 'desc' },
        });
        const orderKey = lastTask
            ? (0, fractional_1.generateKeyAfter)(lastTask.orderKey)
            : 'V'; // First task in column gets midpoint
        const task = await prisma.task.create({
            data: {
                title: input.title,
                description: input.description || null,
                status: status,
                orderKey,
                lastModifiedBy: input.username,
            },
        });
        const log = await HistoryService_1.historyService.addLog({
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
    async updateTask(input) {
        const { id, version, ...fields } = input;
        // Build dynamic update data with only provided fields
        const updateData = {};
        if (fields.title !== undefined)
            updateData.title = fields.title;
        if (fields.description !== undefined)
            updateData.description = fields.description;
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
            const log = await HistoryService_1.historyService.logActionAndUpdateTask({
                action: 'UPDATE',
                taskId: updated.id,
                taskTitle: updated.title,
                userId: input.userId,
                details: 'Updated task details',
            });
            return { task: updated, conflict: false, log };
        }
        catch (error) {
            return { task: null, conflict: true };
        }
    }
    /**
     * Move a task to a different column and/or new position.
     * Uses OCC via version field.
     */
    async moveTask(input) {
        const { id, status, orderKey, version } = input;
        try {
            const result = await prisma.task.updateMany({
                where: { id, version },
                data: {
                    status: status,
                    orderKey,
                    lastModifiedBy: input.username,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                return { task: null, conflict: true };
            }
            const updated = await prisma.task.findUnique({ where: { id } });
            const log = await HistoryService_1.historyService.logActionAndUpdateTask({
                action: 'MOVE',
                taskId: updated.id,
                taskTitle: updated.title,
                userId: input.userId,
                details: `Moved to ${status}`,
            });
            return { task: updated, conflict: false, log };
        }
        catch (error) {
            return { task: null, conflict: true };
        }
    }
    /**
     * Delete a task. Uses version check for OCC.
     */
    async deleteTask(input) {
        const { id, version } = input;
        try {
            const task = await prisma.task.findUnique({ where: { id } });
            if (!task)
                return { success: false, conflict: true };
            const result = await prisma.task.deleteMany({
                where: { id, version },
            });
            if (result.count === 0) {
                return { success: false, conflict: true };
            }
            const log = await HistoryService_1.historyService.addLog({
                action: 'DELETE',
                taskId: id,
                taskTitle: task.title,
                userId: input.userId,
            });
            return { success: true, conflict: false, log };
        }
        catch (error) {
            return { success: false, conflict: true };
        }
    }
    /**
     * Lock a task for editing by a specific user.
     * Only locks if not already locked by someone else.
     */
    async lockTask(input) {
        const { id, userId } = input;
        // Check current lock state
        const current = await prisma.task.findUnique({ where: { id } });
        if (!current)
            return { task: null, alreadyLocked: false };
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
    async unlockTask(input) {
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
    async unlockAllByUser(userId) {
        await prisma.task.updateMany({
            where: { lockedBy: userId },
            data: { lockedBy: null },
        });
    }
}
exports.TaskService = TaskService;
exports.taskService = new TaskService();
//# sourceMappingURL=TaskService.js.map