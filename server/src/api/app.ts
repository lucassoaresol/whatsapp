import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import cors from 'cors';
import express from 'express';

import { ClientManagerPromise } from '../models/clientManager.js';
import { chatQueue } from '../worker/services/chat.js';
import { messageQueue } from '../worker/services/message.js';
import { voteQueue } from '../worker/services/vote.js';

import verifyClient from './middlewares/verifyClient.js';
import verifyClientConnect from './middlewares/verifyClientConnect.js';
import clientRouter from './routes/client.js';
import clientManagerRouter from './routes/clientManager.js';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(chatQueue),
    new BullMQAdapter(messageQueue),
    new BullMQAdapter(voteQueue),
  ],
  serverAdapter: serverAdapter,
});

const app = express();

app.use(cors());
app.use(express.json());
app.use('/admin/queues', serverAdapter.getRouter());
app.use('/static', express.static('public'));

app.use(async (req, res, next) => {
  const clientManager = await ClientManagerPromise;
  req.clientManager = clientManager;
  next();
});

app.use('/clients', clientRouter);
app.use('/:id', verifyClient, verifyClientConnect, clientManagerRouter);

export default app;
