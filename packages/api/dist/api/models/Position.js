"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Position.ts */
const mongoose_1 = require("mongoose");
const positionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose_1.Schema.Types.ObjectId, },
    taskId: { type: mongoose_1.Schema.Types.ObjectId, },
    loc: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
    },
    timestamp: { type: Date, default: Date.now },
});
positionSchema.index({ loc: '2dsphere' });
positionSchema.index({ userId: 1, timestamp: -1 });
exports.default = mongoose_1.models.Position || (0, mongoose_1.model)('Position', positionSchema);
