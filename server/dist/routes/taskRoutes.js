"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TaskService_1 = require("../services/TaskService");
const router = (0, express_1.Router)();
/**
 * GET /tasks
 * Returns all tasks sorted by status and orderKey.
 * Used for initial data fetching on page load.
 */
router.get('/tasks', async (_req, res) => {
    try {
        const tasks = await TaskService_1.taskService.getAllTasks();
        res.json({ success: true, tasks });
    }
    catch (error) {
        console.error('[REST] Failed to fetch tasks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
    }
});
/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map