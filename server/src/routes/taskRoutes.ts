import { Router, Request, Response } from 'express';
import { taskService } from '../services/TaskService';

const router = Router();

/**
 * GET /tasks
 * Returns all tasks sorted by status and orderKey.
 * Used for initial data fetching on page load.
 */
router.get('/tasks', async (_req: Request, res: Response) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.json({ success: true, tasks });
    } catch (error) {
        console.error('[REST] Failed to fetch tasks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
