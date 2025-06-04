import { Router } from 'express';

import verifyClient from '../middlewares/verifyClient';
import verifyClientConnect from '../middlewares/verifyClientConnect';

import clientManagerRouter from './clientManager';
import clientRouter from './client';

const router = Router();

router.use('/clients', clientRouter);
router.use('/:id', verifyClient, verifyClientConnect, clientManagerRouter);

export default router;
