import { z } from 'zod';
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        DONE: "DONE";
    }>>>;
    userId: z.ZodString;
    username: z.ZodString;
}, z.core.$strip>;
export declare const updateTaskSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    version: z.ZodNumber;
    userId: z.ZodString;
    username: z.ZodString;
}, z.core.$strip>;
export declare const moveTaskSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<{
        TODO: "TODO";
        IN_PROGRESS: "IN_PROGRESS";
        DONE: "DONE";
    }>;
    orderKey: z.ZodString;
    version: z.ZodNumber;
    userId: z.ZodString;
    username: z.ZodString;
}, z.core.$strip>;
export declare const deleteTaskSchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodNumber;
    userId: z.ZodString;
    username: z.ZodString;
}, z.core.$strip>;
export declare const lockTaskSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
}, z.core.$strip>;
export declare const unlockTaskSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
}, z.core.$strip>;
export declare const reorderTaskSchema: z.ZodObject<{
    id: z.ZodString;
    orderKey: z.ZodString;
    version: z.ZodNumber;
}, z.core.$strip>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type LockTaskInput = z.infer<typeof lockTaskSchema>;
export type UnlockTaskInput = z.infer<typeof unlockTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
//# sourceMappingURL=schemas.d.ts.map