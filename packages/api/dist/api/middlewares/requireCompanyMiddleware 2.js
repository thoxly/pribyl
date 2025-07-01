"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCompanyMiddleware = void 0;
const requireCompanyMiddleware = (req, res, next) => {
    if (!req.user?.company) {
        res.status(403).json({ error: "Компания не указана" });
        return;
    }
    next();
};
exports.requireCompanyMiddleware = requireCompanyMiddleware;
