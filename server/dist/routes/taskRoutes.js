"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TaskService_1 = require("../services/TaskService");
const PresenceService_1 = require("../services/PresenceService");
const router = (0, express_1.Router)();
/**
 * GET /users/online
 * Returns a list of currently online users.
 */
router.get('/users/online', (_req, res) => {
    try {
        const users = PresenceService_1.presenceService.getConnectedUsers();
        res.json({ success: true, users });
    }
    catch (error) {
        console.error('[REST] Failed to fetch online users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch online users' });
    }
});
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