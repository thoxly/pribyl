"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/Session.ts
const mongoose_1 = require("mongoose");
const sessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Task", required: false, },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
});
sessionSchema.index({ userId: 1, startedAt: -1 });
exports.default = mongoose_1.models.Session || (0, mongoose_1.model)('Session', sessionSchema);
