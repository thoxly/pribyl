"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
router.get('/company-workers', authMiddleware_1.authMiddleware, async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ message: 'Компания не указана' });
            return;
        }
        const workers = await User_1.default.find({ company: companyId }).select('_id fullName photoUrl status');
        res.json(workers);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
