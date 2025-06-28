import { Router, Request, Response, NextFunction } from 'express';
import User from '../models/User'; 
import { authMiddleware } from "../middlewares/authMiddleware"; 

const router = Router();


router.post(
  '/create-invite',
  authMiddleware,  
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, companyId } = req.body;
      const inviter = req.user; 

      if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'code is required' });
        return;
      }

      await User.create({
        role: 'worker',
        company: companyId || null,
        onboardingCompleted: false,
        inviteCode: code,
        manager: inviter!._id,   
      });

      res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);


export default router;