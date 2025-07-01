"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const company_1 = __importDefault(require("./routes/company"));
const createInvite_1 = __importDefault(require("./routes/createInvite"));
const worker_1 = __importDefault(require("./routes/worker"));
const yandex_1 = __importDefault(require("./routes/yandex"));
const companyWorkers_1 = __importDefault(require("./routes/companyWorkers"));
const task_1 = __importDefault(require("./routes/task"));
const positions_1 = __importDefault(require("./routes/positions"));
const worker_2 = __importDefault(require("./routes/worker"));
const positionsPeriodRouter_1 = __importDefault(require("./routes/positionsPeriodRouter"));
const tracksSegmentsRouter_1 = __importDefault(require("./routes/tracksSegmentsRouter"));
const app = (0, express_1.default)();
// Логируем origin каждого запроса
app.use((req, res, next) => {
    console.log('🌐 Origin:', req.headers.origin);
    next();
});
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json());
// Подключаем маршруты
app.use('/api', auth_1.default);
app.use('/api', company_1.default);
app.use('/api', users_1.default);
app.use('/api', createInvite_1.default);
app.use('/api', worker_1.default);
app.use("/api", yandex_1.default);
app.use("/api", companyWorkers_1.default);
app.use("/api", task_1.default);
app.use('/api', positions_1.default);
app.use('/api', worker_2.default);
app.use('/api', positionsPeriodRouter_1.default);
app.use('/api', tracksSegmentsRouter_1.default);
exports.default = app;
