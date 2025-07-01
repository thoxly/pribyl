"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/tasks.ts
const express_1 = require("express");
const Task_1 = __importDefault(require("../models/Task"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const requireCompanyMiddleware_1 = require("../middlewares/requireCompanyMiddleware");
const sendTaskToWorker_1 = require("../../bot/src/services/sendTaskToWorker");
const wsServer_1 = require("../wsServer");
const router = (0, express_1.Router)();
router.get("/tasks", authMiddleware_1.authMiddleware, requireCompanyMiddleware_1.requireCompanyMiddleware, async (req, res, next) => {
    try {
        const tasks = await Task_1.default.find({ company: req.user.company })
            .populate("workerId", "fullName photoUrl")
            .populate("createdBy", "fullName")
            .lean();
        res.json(tasks);
    }
    catch (error) {
        next(error);
    }
});
router.post("/tasks", authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const { title, address, workerId, dateStart, deadline, description, requiresVerification, } = req.body;
        if (!title) {
            res.status(400).json({ error: "Title is required" });
            return;
        }
        const status = workerId ? "accepted" : "assigned";
        const task = new Task_1.default({
            title,
            address,
            workerId,
            status,
            dateStart,
            deadline,
            description,
            createdBy: req.user._id,
            company: req.user.company,
            requiresVerification,
        });
        await task.save();
        if (workerId) {
            console.log("DEBUG task:", {
                _id: task._id,
                workerId: task.workerId,
                company: task.company,
            });
            await (0, sendTaskToWorker_1.sendTaskToWorker)(task); // ✅ отправляем задачу воркеру
        }
        else {
            // 🔧 Заглушка — уведомить всех воркеров компании
            console.log(`[TODO] notify all workers in company ${req.user.company} about new task ${task._id}`);
        }
        const populatedTask = await Task_1.default.findById(task._id)
            .populate("workerId", "fullName photoUrl")
            .populate("createdBy", "fullName")
            .lean();
        res.status(201).json(populatedTask);
    }
    catch (error) {
        next(error);
    }
});
// Получить все задачи
// Обновить задачу
router.put("/tasks/:id", authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, address, workerId, status, dateStart, deadline, description, requiresVerification, company, } = req.body;
        if (!title) {
            res.status(400).json({ error: "Title is required" });
            return;
        }
        const updatedTask = await Task_1.default.findByIdAndUpdate(id, {
            title,
            address,
            workerId,
            status,
            dateStart,
            deadline,
            description,
            requiresVerification,
            createdBy: req.user._id,
            company: req.user.company,
        }, { new: true, runValidators: true })
            .populate("workerId", "fullName photoUrl")
            .populate("createdBy", "fullName")
            .lean();
        if (!updatedTask) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        // 🟢 Отправляем обновление по WebSocket
        (0, wsServer_1.broadcastTaskUpdate)(updatedTask._id.toString());
        res.json(updatedTask);
    }
    catch (error) {
        next(error);
    }
});
// Удалить задачу
router.delete("/tasks/:id", authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedTask = await Task_1.default.findByIdAndDelete(id);
        if (!deletedTask) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        res.status(204).json({});
    }
    catch (error) {
        next(error);
    }
});
// Обновить статус задачи
router.patch("/tasks/:id/status", authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatuses = [
            "assigned",
            "accepted",
            "in-progress",
            "completed",
            "overdue",
            "needs_rework",
            "done",
            "cancelled",
        ];
        if (!allowedStatuses.includes(status)) {
            res.status(400).json({ error: "Invalid status" });
            return;
        }
        const task = await Task_1.default.findById(id);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        task.status = status;
        await task.save();
        const updatedTask = await Task_1.default.findById(id)
            .populate("workerId", "fullName photoUrl")
            .populate("createdBy", "fullName")
            .lean();
        res.json(updatedTask);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
