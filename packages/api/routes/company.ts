import { Router, Request, Response, NextFunction } from 'express';
import Company from '../models/Company';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();

// Получить компанию по токену пользователя
router.get('/my-company', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Проверка токена
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Не предоставлен токен авторизации' });
            return;
        }

        // Верификация токена
        if (!process.env.JWT_SECRET) {
            res.status(500).json({ error: 'Внутренняя ошибка сервера: отсутствует JWT_SECRET' });
            return;
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
        } catch (err) {
            res.status(401).json({ error: 'Неверный или просроченный токен' });
            return;
        }

        // Поиск пользователя с populate компании
        const user = await User.findById(payload.id).populate('company');
        
        if (!user) {
            res.status(404).json({ error: 'Пользователь не найден' });
            return;
        }

        if (!user.company) {
            res.status(404).json({ error: 'Пользователь не привязан к компании' });
            return;
        }

        // Возвращаем данные компании
        res.json(user.company);
    } catch (err) {
        next(err);
    }
});



router.post('/create-company', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "No token" });
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const { name, inn, kpp, ogrn } = req.body;

    if (!name) {
      res.status(400).json({ error: "Название обязательно" });
      return;
    }

    // 1. Создаём компанию
    const company = await Company.create({ name, inn, kpp, ogrn, users: [payload.id] });

    // 2. Обновляем пользователя: привязываем к компании + ставим флаг онбординга
    await User.findByIdAndUpdate(payload.id, {
      company: company._id,
      onboardingCompleted: true,
    });

    res.json({ success: true, companyId: company._id });
  } catch (err) {
    next(err);
  }
});



export default router;