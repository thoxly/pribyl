"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const attachUser = async (ctx, next) => {
    if (!ctx.from)
        return next();
    const user = await User_1.default.findOne({ telegramId: ctx.from.id });
    if (user)
        ctx.user = user;
    return next();
};
exports.attachUser = attachUser;
