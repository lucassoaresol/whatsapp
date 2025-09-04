import { Router } from 'express';

import verifyClient from '../middlewares/verifyClient';
import verifyClientConnect from '../middlewares/verifyClientConnect';

import clientRouter from './client';
import clientManagerRouter from './clientManager';

const router = Router();

router.use('/clients', clientRouter);
router.use('/:id', verifyClient, verifyClientConnect, clientManagerRouter);

export default router;
