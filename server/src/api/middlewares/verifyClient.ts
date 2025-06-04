import { NextFunction, Request, Response } from 'express';

import { ClientManagerPromise } from '../../models/clientManager';

const verifyClient = async (req: Request, res: Response, next: NextFunction) => {
  const clientManager = await ClientManagerPromise;
  const client = clientManager.getClient(req.params.id);
  if (client) {
    req.client = client;
    return next();
  }
  res.status(404).json('client not found');
};

export default verifyClient;
