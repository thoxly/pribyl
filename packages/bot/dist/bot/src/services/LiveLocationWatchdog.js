"use strict";
// import { Types } from "mongoose";
// import LiveLocationService from "./LiveLocationService";
// import logger from "../logger";
// import { LiveWatchRepo } from "./LiveWatchRepo"; 
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWatch = startWatch;
exports.updateWatch = updateWatch;
exports.stopWatch = stopWatch;
// type UserId = string; // ObjectId.toString()
// interface Watch {
//   messageId: number;
//   expireAt: number; // millis
//   lastSeen: number; // millis
// }
// const WATCHES = new Map<UserId, Watch>();
// const CHECK_MS = 30_000; // как часто проверяем
// const IDLE_MS = 3 * 60_000; // нет апдейтов > 3 мин
// const GRACE_MS = 15_000; // «пустой» апдейт ≤ 15 c
// /** вызываем при первой точке (`message.location.live_period`) */
// export function startWatch(
//   userId: Types.ObjectId,
//   messageId: number,
//   msgDate: number, // unixtime из Telegram
//   livePeriod: number // секунд
// ): void {
//   const id = userId.toString();
//   const expireAt = (msgDate + livePeriod) * 1000;
//   WATCHES.set(id, {
//     messageId,
//     expireAt,
//     lastSeen: Date.now(),
//   });
//   logger.debug(
//     `[Watchdog] ▶️ startWatch userId=${id}, messageId=${messageId}, livePeriod=${livePeriod}s, expireAt=${new Date(expireAt).toISOString()}`
//   );
// }
// /** вызываем НА ЛЮБОЙ `edited_message` с location */
// export function updateWatch(
//   userId: Types.ObjectId,
//   hasLivePeriod: boolean
// ): void {
//   const id = userId.toString();
//   const w = WATCHES.get(id);
//   if (!w) {
//     logger.debug(`[Watchdog] ⚠️ updateWatch called but no active watch for ${id}`);
//     return;
//   }
//   w.lastSeen = Date.now();
//   logger.debug(
//     `[Watchdog] 🔄 updateWatch userId=${id}, hasLivePeriod=${hasLivePeriod}, lastSeen=${new Date(w.lastSeen).toISOString()}`
//   );
//   // if hasLivePeriod — ничего не меняем
// }
// /** вызываем вручную, если STOP гарантирован (см. ниже) */
// export async function stopWatch(userId: Types.ObjectId): Promise<void> {
//   const id = userId.toString();
//   logger.debug(`[Watchdog] ⛔ stopWatch called for userId=${id}`);
//   await endSharing(id);
// }
// /** единый таймер */
// setInterval(() => {
//   const now = Date.now();
//   for (const [id, w] of WATCHES) {
//     const idle = now - w.lastSeen > IDLE_MS;
//     const expired = now > w.expireAt + GRACE_MS;
//     if (idle || expired) {
//       logger.debug(
//         `[Watchdog] 🕓 Timer triggered for ${id}. Idle=${idle}, Expired=${expired}. Now=${new Date(now).toISOString()}`
//       );
//       endSharing(id);
//     }
//   }
// }, CHECK_MS);
// async function endSharing(id: UserId): Promise<void> {
//   WATCHES.delete(id);
//   logger.info(`[Watchdog] 🛑 Ending live location for userId=${id}`);
//   const userId = new Types.ObjectId(id);
//   try {
//     await LiveLocationService.setLiveLocationActive(userId, false);
//     await LiveLocationService.notifyLoss(userId);
//     logger.debug(`[Watchdog] ℹ️ LiveLocation deactivated and user notified: ${id}`);
//   } catch (e) {
//     logger.error(
//       `[Watchdog] ❌ Error while ending sharing for ${id}: ${(e as Error).stack ?? e}`
//     );
//   }
// }
const mongoose_1 = require("mongoose");
const LiveLocationService_1 = __importDefault(require("./LiveLocationService"));
const logger_1 = __importDefault(require("../logger"));
const LiveWatchRepo_1 = require("./LiveWatchRepo");
const WATCHES = new Map();
const CHECK_MS = 50000; // как часто пробегаемся по WATCHES
const IDLE_MS = 5 * 60000; // нет апдейтов > 3 мин → считаем idle
const GRACE_MS = 15000; // «пустой» апдейт ≤ 15 с
// ────────────────────────────────────────────────────────────────────────────
// Bootstrap: поднимаем watchdog из Mongo при старте процесса
// ────────────────────────────────────────────────────────────────────────────
(async function warmUpLiveWatches() {
    try {
        const rows = await LiveWatchRepo_1.LiveWatchRepo.getActive();
        for (const row of rows) {
            WATCHES.set(row.userId.toString(), {
                messageId: row.messageId,
                expireAt: row.expireAt.getTime(),
                lastSeen: row.lastSeen.getTime(),
            });
        }
        logger_1.default.info(`[Watchdog] 🔁 Restored ${rows.length} active watches from Mongo (startup)`);
    }
    catch (e) {
        logger_1.default.error(`[Watchdog] ❌ Warm‑up error: ${e.stack ?? e}`);
    }
})();
// ────────────────────────────────────────────────────────────────────────────
// Public API — используется в Telegram‑хендлере
// ────────────────────────────────────────────────────────────────────────────
/** Вызываем при _первой_ точке с `live_period`. */
async function startWatch(userId, messageId, msgDate, // unixtime от Telegram
livePeriod // секунд
) {
    const id = userId.toString();
    const expireAt = (msgDate + livePeriod) * 1000;
    WATCHES.set(id, { messageId, expireAt, lastSeen: Date.now() });
    await LiveWatchRepo_1.LiveWatchRepo.upsert(userId, messageId, expireAt);
    logger_1.default.debug(`[Watchdog] ▶️ startWatch userId=${id}, messageId=${messageId}, livePeriod=${livePeriod}s, expireAt=${new Date(expireAt).toISOString()}`);
}
/** Вызываем _на любой_ `edited_message` с location. */
async function updateWatch(userId, hasLivePeriod) {
    const id = userId.toString();
    let w = WATCHES.get(id);
    // Само‑восстановление, если бот перезапустился после старта live‑sharing
    if (!w && hasLivePeriod) {
        logger_1.default.debug(`[Watchdog] ♻️ Self‑healing: create watch on the fly for ${id}`);
        await startWatch(userId, 0, Math.floor(Date.now() / 1000), 30 * 60); // fallback 30 мин
        w = WATCHES.get(id);
    }
    if (!w) {
        logger_1.default.debug(`[Watchdog] ⚠️ updateWatch called but no active watch for ${id}`);
        return;
    }
    w.lastSeen = Date.now();
    await LiveWatchRepo_1.LiveWatchRepo.touch(userId);
    logger_1.default.debug(`[Watchdog] 🔄 updateWatch userId=${id}, hasLivePeriod=${hasLivePeriod}, lastSeen=${new Date(w.lastSeen).toISOString()}`);
}
/** Вызываем вручную, если STOP гарантирован (кнопка STOP в UI). */
function stopWatch(userId) {
    logger_1.default.debug(`[Watchdog] ⛔ stopWatch called for userId=${userId}`);
    return endSharing(userId.toString());
}
// ────────────────────────────────────────────────────────────────────────────
// Внутреннее: единый таймер, проверяет idle/expired и завершает sharing
// ────────────────────────────────────────────────────────────────────────────
setInterval(() => {
    const now = Date.now();
    for (const [id, w] of WATCHES) {
        const idle = now - w.lastSeen > IDLE_MS;
        const expired = now > w.expireAt + GRACE_MS;
        if (idle || expired) {
            logger_1.default.debug(`[Watchdog] 🕓 Timer triggered for ${id}. Idle=${idle}, Expired=${expired}. Now=${new Date(now).toISOString()}`);
            void endSharing(id);
        }
    }
}, CHECK_MS);
// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
async function endSharing(id) {
    WATCHES.delete(id);
    await LiveWatchRepo_1.LiveWatchRepo.remove(new mongoose_1.Types.ObjectId(id));
    logger_1.default.info(`[Watchdog] 🛑 Ending live location for userId=${id}`);
    const userId = new mongoose_1.Types.ObjectId(id);
    try {
        await LiveLocationService_1.default.setLiveLocationActive(userId, false);
        await LiveLocationService_1.default.notifyLoss(userId);
        logger_1.default.debug(`[Watchdog] ℹ️ LiveLocation deactivated and user notified: ${id}`);
    }
    catch (e) {
        logger_1.default.error(`[Watchdog] ❌ Error while ending sharing for ${id}: ${e.stack ?? e}`);
    }
}
