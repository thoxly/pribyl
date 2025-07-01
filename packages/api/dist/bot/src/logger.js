"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const path_1 = __importDefault(require("path"));
// Получаем текущую папку
const logFilePath = path_1.default.join(__dirname, "live-location.log");
const logger = (0, winston_1.createLogger)({
    level: "debug",
    format: winston_1.format.combine(winston_1.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), winston_1.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)),
    transports: [
        new winston_1.transports.File({
            filename: logFilePath,
            level: "debug",
        }),
        new winston_1.transports.Console({
            level: "debug",
        }),
    ],
});
// Диагностика проблем с записью
logger.on("error", (err) => {
    console.error("Logger write error:", err);
});
exports.default = logger;
