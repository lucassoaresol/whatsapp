import { Request, Response, Router } from 'express';

import { ClientManagerPromise } from '../../models/clientManager.js';

import verifyClient from '../middlewares/verifyClient.js';

const clientRouter = Router();

clientRouter.post('', async (req: Request, res: Response) => {
  const clientManager = await ClientManagerPromise;
  await clientManager.addClient(req.body.id);
  res.status(201).json('sucess');
});

clientRouter.get('', async (req: Request, res: Response) => {
  const clientManager = await ClientManagerPromise;
  const clients = await clientManager.listClients();
  res.json(clients);
});

clientRouter.get('/:id', verifyClient, async (req: Request, res: Response) => {
  const chats = await req.client.getChats();
  res.json(chats);
});

clientRouter.get('/:id/status', verifyClient, (req: Request, res: Response) => {
  res.json(req.client.getInfo());
});

clientRouter.get('/:id/qr', verifyClient, async (req: Request, res: Response) => {
  res.redirect(`/static/qr/${req.params.id}_qr.png`);
});

export default clientRouter;
