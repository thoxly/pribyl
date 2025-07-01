"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSession = void 0;
const Session_1 = __importDefault(require("../models/Session"));
const attachSession = async (ctx, next) => {
    if (!ctx.user)
        return next();
    // Пытаемся найти активную сессию пользователя
    const activeSession = await Session_1.default.findOne({
        userId: ctx.user._id,
        endedAt: null,
    });
    if (activeSession) {
        ctx.session = activeSession;
    }
    else {
        ctx.session = null;
    }
    return next();
};
exports.attachSession = attachSession;
