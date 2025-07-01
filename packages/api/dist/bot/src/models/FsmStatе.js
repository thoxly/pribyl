"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/FsmState.ts
const mongoose_1 = require("mongoose");
/* --- схема ------------------------------------------------------------- */
const LiveLocationSchema = new mongoose_1.Schema({
    active: { type: Boolean, default: false },
    lastSeen: { type: Date },
    expireAt: { type: Date },
}, { _id: false, versionKey: false });
const FsmStateSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", sparse: true },
    telegramId: { type: Number, sparse: true },
    state: { type: String, required: true },
    data: {
        taskId: { type: String },
        liveLocation: { type: LiveLocationSchema, default: undefined },
    },
}, {
    /* обновляем updatedAt автоматически, createdAt не нужен */
    timestamps: { updatedAt: true, createdAt: false },
    versionKey: false,
});
/* уникальность по одному из идентификаторов ---------------------------- */
FsmStateSchema.index({ userId: 1 }, { unique: true, sparse: true });
FsmStateSchema.index({ telegramId: 1 }, { unique: true, sparse: true });
exports.default = mongoose_1.models.FsmState ||
    (0, mongoose_1.model)("FsmState", FsmStateSchema);
