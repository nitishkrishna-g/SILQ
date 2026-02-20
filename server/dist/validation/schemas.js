"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderTaskSchema = exports.unlockTaskSchema = exports.lockTaskSchema = exports.deleteTaskSchema = exports.moveTaskSchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
const StatusEnum = zod_1.z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: zod_1.z.string().max(2000, 'Description too long').optional().nullable(),
    status: StatusEnum.optional().default('TODO'),
});
exports.updateTaskSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid task ID'),
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(2000).optional().nullable(),
    version: zod_1.z.number().int().positive('Version must be a positive integer'),
});
exports.moveTaskSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid task ID'),
    status: StatusEnum,
    orderKey: zod_1.z.string().min(1, 'Order key is required'),
    version: zod_1.z.number().int().positive('Version must be a positive integer'),
});
exports.deleteTaskSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid task ID'),
    version: zod_1.z.number().int().positive('Version must be a positive integer'),
});
exports.lockTaskSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid task ID'),
    userId: zod_1.z.string().min(1, 'User ID is required'),
});
exports.unlockTaskSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid task ID'),
    userId: zod_1.z.string().min(1, 'User ID is required'),
});
exports.reorderTaskSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid task ID'),
    orderKey: zod_1.z.string().min(1, 'Order key is required'),
    version: zod_1.z.number().int().positive('Version must be a positive integer'),
});
//# sourceMappingURL=schemas.js.map