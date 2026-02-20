import { z } from 'zod';

const StatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional().nullable(),
    status: StatusEnum.optional().default('TODO'),
});

export const updateTaskSchema = z.object({
    id: z.string().uuid('Invalid task ID'),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    version: z.number().int().positive('Version must be a positive integer'),
});

export const moveTaskSchema = z.object({
    id: z.string().uuid('Invalid task ID'),
    status: StatusEnum,
    orderKey: z.string().min(1, 'Order key is required'),
    version: z.number().int().positive('Version must be a positive integer'),
});

export const deleteTaskSchema = z.object({
    id: z.string().uuid('Invalid task ID'),
    version: z.number().int().positive('Version must be a positive integer'),
});

export const lockTaskSchema = z.object({
    id: z.string().uuid('Invalid task ID'),
    userId: z.string().min(1, 'User ID is required'),
});

export const unlockTaskSchema = z.object({
    id: z.string().uuid('Invalid task ID'),
    userId: z.string().min(1, 'User ID is required'),
});

export const reorderTaskSchema = z.object({
    id: z.string().uuid('Invalid task ID'),
    orderKey: z.string().min(1, 'Order key is required'),
    version: z.number().int().positive('Version must be a positive integer'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type LockTaskInput = z.infer<typeof lockTaskSchema>;
export type UnlockTaskInput = z.infer<typeof unlockTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
