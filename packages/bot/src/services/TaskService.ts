import { Types } from "mongoose";
import Task, { ITask } from "../models/Task";
import Session from "../models/Session";
import FsmState, { IFsmState } from "../models/FsmStatе";

export class TaskService {
  async inprogressAssignedTask(
    taskId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<boolean> {
    console.debug(
      `[TaskService][inprogressAssignedTask] userId: ${userId}, taskId: ${taskId}`
    );

    const task = await Task.findOne({
      _id: taskId,
      workerId: userId,
      status: "accepted",
    });

    if (!task) {
      console.warn(
        `[TaskService][inprogressAssignedTask] Task not found or invalid status`
      );
      return false;
    }

    task.status = "in-progress";
    await task.save();
    console.debug(
      `[TaskService][inprogressAssignedTask] Task status updated to in-progress`
    );

    await Session.create({
      userId,
      taskId: task._id,
      companyId: task.companyId,
      startedAt: new Date(),
      liveLocationActive: false,
    });
    console.debug(`[TaskService][inprogressAssignedTask] Session created`);

    return true;
  }

  async startTask(userId: Types.ObjectId): Promise<boolean> {
    console.debug(`[TaskService][startTaskIfLiveLocation] userId: ${userId}`);

    const taskId = await TaskService.getCurrentTask(userId);
    console.debug(
      `[TaskService][startTaskIfLiveLocation] Current taskId: ${taskId}`
    );

    if (!taskId) {
      console.warn(
        `[TaskService][startTaskIfLiveLocation] No current task for user`
      );
      return false;
    }

    const task = await Task.findById(taskId);
    if (!task) {
      console.warn(`[TaskService][startTaskIfLiveLocation] Task not found`);
      return false;
    }

    if (task.status !== "accepted") {
      console.warn(
        `[TaskService][startTaskIfLiveLocation] Task status is not accepted`
      );
      return false;
    }

    task.status = "in-progress";
    await task.save();
    console.debug(
      `[TaskService][startTaskIfLiveLocation] Task status updated to in-progress`
    );

    return true;
  }

  async completeTask(
    userId: Types.ObjectId,
    taskId: Types.ObjectId
  ): Promise<boolean> {
    console.debug(
      `[TaskService][completeTask] userId: ${userId}, taskId: ${taskId}`
    );

    // Проверяем, существует ли задача и принадлежит ли она пользователю
    const task = await Task.findOne({
      _id: taskId,
      workerId: userId,
      status: "in-progress",
    });

    if (!task) {
      console.warn(
        `[TaskService][completeTask] Task not found or not in in-progress status`
      );
      return false;
    }

    // Обновляем статус задачи на "completed"
    task.status = "completed";
    await task.save();
    console.debug(
      `[TaskService][completeTask] Task status updated to completed`
    );

    // Обновляем сессию (если нужно завершить активную сессию)
    await Session.updateOne(
      { userId, taskId, endedAt: { $exists: false } },
      { $set: { endedAt: new Date() } }
    );
    console.debug(`[TaskService][completeTask] Session updated`);

    return true;
  }

  async doneTask(
  taskId: Types.ObjectId
): Promise<boolean> {
  console.debug(`[TaskService][doneTask] taskId: ${taskId}`);

  const task = await Task.findById(taskId);
  if (!task) {
    console.warn(`[TaskService][doneTask] Task not found`);
    return false;
  }

  // Обновляем статус задачи на "done"
  task.status = "done";
  await task.save();
  console.debug(`[TaskService][doneTask] Task status updated to done`);

  return true;
}

async rejectTask(
  taskId: Types.ObjectId
): Promise<boolean> {
  console.debug(`[TaskService][rejectTask] taskId: ${taskId}`);

  const task = await Task.findById(taskId);
  if (!task) {
    console.warn(`[TaskService][rejectTask] Task not found`);
    return false;
  }

  // Обновляем статус задачи на "needs_rework"
  task.status = "needs_rework";
  await task.save();
  console.debug(`[TaskService][rejectTask] Task status updated to needs_rework`);

  return true;
}


  async returnTaskToInProgress(
    userId: Types.ObjectId,
    taskId: Types.ObjectId
  ): Promise<boolean> {
    console.debug(
      `[TaskService][returnTaskToInProgress] userId: ${userId}, taskId: ${taskId}`
    );

    // Проверяем, существует ли задача и принадлежит ли она пользователю
    const task = await Task.findOne({
      _id: taskId,
      workerId: userId,
      status: "completed",
    });

    if (!task) {
      console.warn(
        `[TaskService][returnTaskToInProgress] Task not found or not in completed status`
      );
      return false;
    }

    // Обновляем статус задачи на "in-progress"
    task.status = "in-progress";
    await task.save();
    console.debug(
      `[TaskService][returnTaskToInProgress] Task status updated to in-progress`
    );


    return true;
  }

  static async getCurrentTask(
    userId: Types.ObjectId
  ): Promise<Types.ObjectId | null> {
    console.debug(`[UserSessionStore] getCurrentTask for userId: ${userId}`);
    const state = await FsmState.findOne({ userId }).lean<IFsmState>();
    const taskId = state?.data?.taskId;
    console.debug(`[UserSessionStore] Found taskId: ${taskId}`);
    return taskId ? new Types.ObjectId(taskId) : null;
  }
}

const taskService = new TaskService();
export default taskService;
