import { NextFunction, Request, Response } from 'express';

const verifyClient = (req: Request, res: Response, next: NextFunction) => {
  const client = req.clientManager.getClient(req.params.id);
  if (client) {
    req.client = client;
    return next();
  }
  res.status(404).json('client not found');
};

export default verifyClient;
