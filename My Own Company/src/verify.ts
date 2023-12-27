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

    const user = jwt.verify(token, process.env.JWT_SECERT as string);

    res.locals.user = user;

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: 'You are not authorized to enter this route',
    });
  }
}







const authorize = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = res.locals.user as IUser;
  if (!roles.includes(user.role)) {
    return res.status(403).json({
      message: 'You are not authorized to enter this route !',
    });
  }
  next();
}
export { protect, authorize };
