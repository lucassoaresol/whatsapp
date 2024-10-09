import { NextFunction, Request, Response } from 'express';

const verifyClientConnect = (req: Request, res: Response, next: NextFunction) => {
  const clientWPP = req.client.getWpp();
  if (clientWPP.info) return next();

  res.status(500).json('failed connect');
};

export default verifyClientConnect;
