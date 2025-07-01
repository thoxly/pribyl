"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "No token" });
            return;
        }
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(payload.id);
        if (!user) {
            res.status(401).json({ error: "User not found" });
            return;
        }
        req.user = {
            _id: user._id,
            fullName: user.fullName,
            photoUrl: user.photoUrl,
            company: user.company,
        };
        next();
    }
    catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
