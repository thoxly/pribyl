import { Request, Response, NextFunction } from "express";

export const requireCompanyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.company) {
    res.status(403).json({ error: "Компания не указана" });
    return;
  }
  next();
};
