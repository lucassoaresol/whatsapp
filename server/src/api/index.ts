import cors from 'cors';
import express from 'express';

import { getClientManager } from '../models/clientManager.js';

import verifyClient from './middlewares/verifyClient.js';
import verifyClientConnect from './middlewares/verifyClientConnect.js';
import clientRouter from './routes/client.js';
import clientManagerRouter from './routes/clientManager.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/static', express.static('public'));

app.use(async (req, res, next) => {
  const clientManager = await getClientManager();
  req.clientManager = clientManager;
  next();
});

app.use('/clients', clientRouter);
app.use('/:id', verifyClient, verifyClientConnect, clientManagerRouter);

export default app;
