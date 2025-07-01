import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import companyRoutes from './routes/company';
import createInviteRoutes from './routes/createInvite';
import workerRoutes from './routes/worker';
import yandexRouter from "./routes/yandex";
import companyWorkersRouter from './routes/companyWorkers';
import tastRouter from './routes/task';
import positionsLiveRouter from './routes/positions';
import workersLiveRouter from './routes/worker';
import positionsPeriodRouter from './routes/positionsPeriodRouter';
import tracksSegmentsRouter from './routes/tracksSegmentsRouter';

const app = express();

// Логируем origin каждого запроса
app.use((req, res, next) => {
    console.log('🌐 Origin:', req.headers.origin);
    next();
});


app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json());

// Подключаем маршруты
app.use('/api', authRoutes);
app.use('/api', companyRoutes);
app.use('/api', userRoutes);
app.use('/api', createInviteRoutes)
app.use('/api', workerRoutes)
app.use("/api", yandexRouter);
app.use("/api", companyWorkersRouter);
app.use("/api", tastRouter);
app.use('/api', positionsLiveRouter);
app.use('/api', workersLiveRouter);
app.use('/api', positionsPeriodRouter);
app.use('/api', tracksSegmentsRouter);

export default app;