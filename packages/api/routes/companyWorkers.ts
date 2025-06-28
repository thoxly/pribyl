// routes/companyWorkers.ts
import { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import User from '../models/User';

const router = Router();

router.get(
  '/company-workers',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({ message: 'Компания не указана' });
        return;
      }

      const workers = await User.find({ company: companyId }).select(
        '_id fullName photoUrl status'
      );

      res.json(workers);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
