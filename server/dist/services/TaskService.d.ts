import { Task } from '@prisma/client';
import { CreateTaskInput, UpdateTaskInput, MoveTaskInput, DeleteTaskInput, LockTaskInput, UnlockTaskInput } from '../validation/schemas';
export declare class TaskService {
    /**
     * Get all tasks, sorted by orderKey within each status column
     */
    getAllTasks(): Promise<Task[]>;
    /**
     * Create a new task.
     * Assigns an orderKey at the bottom of the target column.
     */
    createTask(input: CreateTaskInput): Promise<Task>;
    /**
     * Update task fields (title, description).
     * Uses OCC: only updates if version matches.
     * Updates specific fields only — never replaces the whole document.
     */
    updateTask(input: UpdateTaskInput): Promise<{
        task: Task | null;
        conflict: boolean;
    }>;
    /**
     * Move a task to a different column and/or new position.
     * Uses OCC via version field.
     */
    moveTask(input: MoveTaskInput): Promise<{
        task: Task | null;
        conflict: boolean;
    }>;
    /**
     * Delete a task. Uses version check for OCC.
     */
    deleteTask(input: DeleteTaskInput): Promise<{
        success: boolean;
        conflict: boolean;
    }>;
    /**
     * Lock a task for editing by a specific user.
     * Only locks if not already locked by someone else.
     */
    lockTask(input: LockTaskInput): Promise<{
        task: Task | null;
        alreadyLocked: boolean;
    }>;
    /**
     * Unlock a task. Only the user who locked it can unlock it.
     */
    unlockTask(input: UnlockTaskInput): Promise<Task | null>;
    /**
     * Unlock all tasks locked by a specific user (e.g., on disconnect)
     */
    unlockAllByUser(userId: string): Promise<void>;
}
export declare const taskService: TaskService;
//# sourceMappingURL=TaskService.d.ts.map