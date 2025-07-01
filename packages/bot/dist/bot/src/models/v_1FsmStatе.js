"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/FsmState.ts
const mongoose_1 = require("mongoose");
const FsmStateSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false },
    telegramId: { type: Number, required: false },
    state: { type: String, required: true },
    data: { type: mongoose_1.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now },
});
// Уникальность по одному из идентификаторов
FsmStateSchema.index({ userId: 1 }, { unique: true, sparse: true });
FsmStateSchema.index({ telegramId: 1 }, { unique: true, sparse: true });
exports.default = mongoose_1.models.FsmState || (0, mongoose_1.model)("FsmState", FsmStateSchema);
