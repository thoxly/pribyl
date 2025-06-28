// packages/api/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No token" });
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const user = await User.findById(payload.id);
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
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
