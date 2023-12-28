import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

interface IUser {
  id: string;
  role: string;
  iat: number;
}

const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({
        message: 'You are not authorized to enter this route',
      });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    res.locals.user = decoded as IUser;

    next();
  } catch (error) {
    console.error("Error in protect middleware:", error);
    return res.status(401).json({
      message: 'Invalid or expired token. Please log in again.',
    });
  }
}

const authorize = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user as IUser;
  const userRole = user.role.toUpperCase(); 
  const allowedRoles = roles.map(role => role.toUpperCase()); 

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: 'You do not have permission to perform this action',
    });
  }
  next();
}


export { protect, authorize };
