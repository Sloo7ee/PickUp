import { Request, Response, NextFunction } from 'express';
import { prisma } from './config/db';

interface UserRole {
  Role: string;
}

export const allow = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies.tokenauth) {
        return res.status(401).json('Invalid token');
      }

      const tokenauth = req.cookies.tokenauth;
      const role = await prisma.roles
        .findUnique({
          where: { id: tokenauth },
          select: { Role: true },
        })
        .then((data) => data?.Role);

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json('Permission denied');
      }

      next();
  };
};
