import { Router } from 'express';

import { ClientManagerPromise } from '../../models/clientManager';
import verifyClient from '../middlewares/verifyClient';
import verifyClientConnect from '../middlewares/verifyClientConnect';

import clientManagerRouter from './clientManager';
import clientRouter from './client';

const router = Router();

router.use(async (req, res, next) => {
  const clientManager = await ClientManagerPromise;
  req.clientManager = clientManager;
  next();
});

router.use('/clients', clientRouter);
router.use('/:id', verifyClient, verifyClientConnect, clientManagerRouter);

export default router;
