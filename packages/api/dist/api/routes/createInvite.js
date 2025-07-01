"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/create-invite', authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const { code, companyId } = req.body;
        const inviter = req.user;
        if (!code || typeof code !== 'string') {
            res.status(400).json({ error: 'code is required' });
            return;
        }
        await User_1.default.create({
            role: 'worker',
            company: companyId || null,
            onboardingCompleted: false,
            inviteCode: code,
            manager: inviter._id,
        });
        res.status(201).json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
