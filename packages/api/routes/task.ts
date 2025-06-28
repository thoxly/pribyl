// routes/tasks.ts
import { Router, Request, Response, NextFunction } from "express";
import Task from "../models/Task";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireCompanyMiddleware } from "../middlewares/requireCompanyMiddleware";
import { sendTaskToWorker } from "../../bot/src/services/sendTaskToWorker";
import { broadcastTaskUpdate } from "../wsServer";

const router = Router();

router.get(
  "/tasks",
  authMiddleware,
  requireCompanyMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tasks = await Task.find({ company: req.user!.company })
        .populate("workerId", "fullName photoUrl")
        .populate("createdBy", "fullName")
        .lean();

      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/tasks",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        title,
        address,
        workerId,
        dateStart,
        deadline,
        description,
        requiresVerification,
      } = req.body;

      if (!title) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const status = workerId ? "accepted" : "assigned";

      const task = new Task({
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

        await sendTaskToWorker(task); // ✅ отправляем задачу воркеру
      } else {
        // 🔧 Заглушка — уведомить всех воркеров компании
        console.log(
          `[TODO] notify all workers in company ${req.user.company} about new task ${task._id}`
        );
      }

      const populatedTask = await Task.findById(task._id)
        .populate("workerId", "fullName photoUrl")
        .populate("createdBy", "fullName")
        .lean();

      res.status(201).json(populatedTask);
    } catch (error) {
      next(error);
    }
  }
);
// Получить все задачи

// Обновить задачу
router.put(
  "/tasks/:id",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        title,
        address,
        workerId,
        status,
        dateStart,
        deadline,
        description,
        requiresVerification,
        company,
      } = req.body;

      if (!title) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const updatedTask = await Task.findByIdAndUpdate(
        id,
        {
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
        },
        { new: true, runValidators: true }
      )
        .populate("workerId", "fullName photoUrl")
        .populate("createdBy", "fullName")
        .lean<{
          _id: string;
        }>();

      if (!updatedTask) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      // 🟢 Отправляем обновление по WebSocket
      broadcastTaskUpdate(updatedTask._id.toString());

      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  }
);

// Удалить задачу
router.delete(
  "/tasks/:id",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedTask = await Task.findByIdAndDelete(id);
      if (!deletedTask) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      res.status(204).json({});
    } catch (error) {
      next(error);
    }
  }
);

// Обновить статус задачи
router.patch(
  "/tasks/:id/status",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const task = await Task.findById(id);
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }

      task.status = status;
      await task.save();

      const updatedTask = await Task.findById(id)
        .populate("workerId", "fullName photoUrl")
        .populate("createdBy", "fullName")
        .lean();

      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
