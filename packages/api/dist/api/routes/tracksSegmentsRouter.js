"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/tracksSegmentsRouter.ts
const express_1 = require("express");
const trackSimplifier_1 = require("../services/trackSimplifier");
const Position_1 = __importDefault(require("../models/Position"));
const router = (0, express_1.Router)();
/**
 * GET /api/tracks/segments
 *   ?workerId=<MongoId>
 *   &dateFrom=<ISO-UTC>
 *   &dateTo=<ISO-UTC>
 *
 * Пример:
 *   /api/tracks/segments?workerId=...&dateFrom=2025-06-26T00:00:00Z&dateTo=2025-06-26T23:59:59Z
 */
router.get("/tracks/segments", async (req, res, next) => {
    try {
        const { workerId, dateFrom, dateTo } = req.query;
        if (!workerId || !dateFrom || !dateTo) {
            res
                .status(400)
                .json({ message: "workerId, dateFrom и dateTo обязательны" });
            return;
        }
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
            res.status(400).json({ message: "dateFrom или dateTo имеет неверный формат" });
            return;
        }
        const raw = await Position_1.default.find({
            userId: workerId,
            timestamp: { $gte: start, $lte: end },
        });
        if (raw.length < 2) {
            res.status(204).end();
            return;
        }
        const coordinates = (0, trackSimplifier_1.cleanTrack)(raw);
        res.json({ coordinates });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
