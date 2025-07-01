"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/LiveWatch.ts
const mongoose_1 = require("mongoose");
const LiveWatchSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, unique: true },
    messageId: { type: Number, required: true },
    lastSeen: { type: Date, required: true },
    expireAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL
});
exports.default = (0, mongoose_1.model)("LiveWatch", LiveWatchSchema);
