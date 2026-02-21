import { TaskService } from '../../src/services/TaskService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
    const mPrisma = {
        task: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
        },
    };
    return { PrismaClient: jest.fn(() => mPrisma) };
});

// Mock HistoryService
jest.mock('../../src/services/HistoryService', () => ({
    historyService: {
        addLog: jest.fn(),
        logActionAndUpdateTask: jest.fn(),
    },
}));

describe('TaskService Conflict Resolution (OCC)', () => {
    let service: TaskService;
    let prisma: any;

    beforeEach(() => {
        service = new TaskService();
        prisma = new (PrismaClient as any)();
    });

    it('successfully updates a task when version matches', async () => {
        prisma.task.updateMany.mockResolvedValue({ count: 1 });
        prisma.task.findUnique.mockResolvedValue({ id: '1', title: 'New Title', version: 2 });

        const result = await service.updateTask({ id: '1', version: 1, title: 'New Title', userId: 'u1', username: 'test' });

        expect(result.conflict).toBe(false);
        expect(result.task?.title).toBe('New Title');
        expect(prisma.task.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: '1', version: 1 }
        }));
    });

    it('returns a conflict when version mismatches during update', async () => {
        prisma.task.updateMany.mockResolvedValue({ count: 0 });

        const result = await service.updateTask({ id: '1', version: 1, title: 'New Late Title', userId: 'u1', username: 'test' });

        expect(result.conflict).toBe(true);
        expect(result.task).toBeNull();
    });

    it('successfully moves a task when version matches', async () => {
        prisma.task.updateMany.mockResolvedValue({ count: 1 });
        prisma.task.findUnique.mockResolvedValue({ id: '1', status: 'DONE', version: 2 });

        const result = await service.moveTask({ id: '1', version: 1, status: 'DONE', orderKey: 'Z', userId: 'u1', username: 'test' });

        expect(result.conflict).toBe(false);
        expect(result.task?.status).toBe('DONE');
    });

    it('returns a conflict when version mismatches during move', async () => {
        prisma.task.updateMany.mockResolvedValue({ count: 0 });

        const result = await service.moveTask({ id: '1', version: 1, status: 'DONE', orderKey: 'Z', userId: 'u1', username: 'test' });

        expect(result.conflict).toBe(true);
        expect(result.task).toBeNull();
    });

    it('detects conflict during deletion', async () => {
        prisma.task.deleteMany.mockResolvedValue({ count: 0 });

        const result = await service.deleteTask({ id: '1', version: 1, userId: 'u1', username: 'test' });

        expect(result.conflict).toBe(true);
        expect(result.success).toBe(false);
    });
});
