"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapTgToDbId = mapTgToDbId;
const User_1 = __importDefault(require("../models/User"));
async function mapTgToDbId(telegramId) {
    const user = await User_1.default
        .findOne({ telegramId: telegramId.toString() })
        .select('_id')
        .lean();
    return user?._id ?? null;
}
