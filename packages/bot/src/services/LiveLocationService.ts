import { Types } from "mongoose";
import Session, { ISession } from "../models/Session";
import Position, { IPosition } from "../models/Position";
import User, { IUser } from "../models/User";
import FsmState, { IFsmState } from "../models/FsmStatе";
import { sendTelegramMessage } from "./TelegramService";

const MAX_IDLE_MS = 2 * 60 * 1000;

class LiveLocationService {


  static async isLiveLocationActive(userId: Types.ObjectId): Promise<boolean> {
    console.debug(
      "[isLiveLocationActive] Checking FSM for userId:",
      userId.toString()
    );
    const fsm = await FsmState.findOne({ userId }).lean<IFsmState>();
    const active = fsm?.data?.liveLocationActive === true;
    console.debug("[isLiveLocationActive] Result:", active);
    return active;
  }

static async setLiveLocationActive(
  userId: Types.ObjectId,
  active: boolean,
  opts: { expireAt?: Date } = {}
): Promise<void> {
  console.debug(
    "[setLiveLocationActive] userId:", userId.toString(),
    "active:", active,
    "expireAt:", opts.expireAt?.toISOString() ?? "—"
  );

  /* формируем update-объект */
  const $set: Record<string, any> = {
    "data.liveLocation.active": active,
  };

  if (active) {
    /* при включении записываем lastSeen */
    $set["data.liveLocation.lastSeen"] = new Date();
    if (opts.expireAt) {
      $set["data.liveLocation.expireAt"] = opts.expireAt;
    }
  } else {
    /* при выключении чистим expireAt и lastSeen */
    $set["data.liveLocation.lastSeen"] = null;
    $set["data.liveLocation.expireAt"] = null;
  }

  const result = await FsmState.updateOne(
    { userId },
    { $set },
    { upsert: true }
  );

  console.debug("[setLiveLocationActive] Update result:", result);
}

  static async getLiveLocationActive(userId: Types.ObjectId): Promise<boolean> {
    console.debug(
      "[getLiveLocationActive] Checking for userId:",
      userId.toString()
    );

    const state = await FsmState.findOne({ userId }).lean<IFsmState>();
    const isActive = state?.data?.liveLocationActive === true;

    console.debug("[getLiveLocationActive] Found state:", state);
    console.debug("[getLiveLocationActive] liveLocationActive =", isActive);

    return isActive;
  }

  static async checkLiveStatus(userId: Types.ObjectId): Promise<void> {
    console.debug(
      "[checkLiveStatus] Start check for userId:",
      userId.toString()
    );

    const lastPosition = await Position.findOne({ userId })
      .sort({ timestamp: -1 })
      .lean<IPosition>();
    console.debug(
      "[checkLiveStatus] Last position timestamp:",
      lastPosition?.timestamp
    );

    const now = Date.now();
    const lastUpdate = lastPosition
      ? new Date(lastPosition.timestamp).getTime()
      : 0;
    const diff = now - lastUpdate;

    console.debug("[checkLiveStatus] Time since last update (ms):", diff);

    const isActive = lastPosition && diff <= MAX_IDLE_MS;
    const isCurrentlyActive = await this.isLiveLocationActive(userId);

    console.debug("[checkLiveStatus] isActive (from position):", isActive);
    console.debug(
      "[checkLiveStatus] isCurrentlyActive (FSM):",
      isCurrentlyActive
    );

    if (!isActive && isCurrentlyActive) {
      console.debug("[checkLiveStatus] Marking as INACTIVE");
      await this.setLiveLocationActive(userId, false);
      await this.notifyLoss(userId);
    }

    if (isActive && !isCurrentlyActive) {
      console.debug("[checkLiveStatus] Marking as ACTIVE");
      await this.setLiveLocationActive(userId, true);
      await this.notifyResume(userId);
    }
  }

  static async notifyLoss(userId: Types.ObjectId): Promise<void> {
    console.debug("[notifyLoss] userId:", userId.toString());
    const user = await User.findById(userId).lean<IUser>();
    if (user?.telegramId) {
      console.debug("[notifyLoss] Sending Telegram message");
      await sendTelegramMessage(
        user.telegramId,
        "⚠️ Лайв-локация отключена (не получаем координаты)."
      );
    } else {
      console.debug("[notifyLoss] Telegram ID not found");
    }
  }

  static async notifyResume(userId: Types.ObjectId): Promise<void> {
    console.debug("[notifyResume] userId:", userId.toString());
    const user = await User.findById(userId).lean<IUser>();
    if (user?.telegramId) {
      console.debug("[notifyResume] Sending Telegram message");
      await sendTelegramMessage(
        user.telegramId,
        "✅ Лайв-локация снова активна."
      );
    } else {
      console.debug("[notifyResume] Telegram ID not found");
    }
  }
}

export default LiveLocationService;
