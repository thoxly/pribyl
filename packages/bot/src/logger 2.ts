import { createLogger, format, transports } from "winston";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Получаем текущую папку

const logFilePath = path.join(__dirname, "live-location.log");


const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`
    )
  ),
  transports: [
    new transports.File({
      filename: logFilePath,
      level: "debug",
    }),
    new transports.Console({
      level: "debug",
    }),
  ],
});

// Диагностика проблем с записью
logger.on("error", (err) => {
  console.error("Logger write error:", err);
});

export default logger;
