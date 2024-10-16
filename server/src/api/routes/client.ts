import { Request, Response, Router } from 'express';

import verifyClient from '../middlewares/verifyClient.js';

const clientRouter = Router();

clientRouter.post('', async (req: Request, res: Response) => {
  await req.clientManager.addClient(req.body.id);
  res.status(201).json('sucess');
});

clientRouter.get('', (req: Request, res: Response) => {
  res.json(req.clientManager.listClients());
});

clientRouter.get('/:id/status', verifyClient, (req: Request, res: Response) => {
  res.json(req.client.getInfo());
});

clientRouter.get('/:id/qr', verifyClient, async (req: Request, res: Response) => {
  const timeQR = req.client.getRemainingTimeForNextQR();
  if (timeQR >= 25000) {
    res.redirect(`/${req.params.id}_qr.png`);
  } else {
    setTimeout(() => {
      res.redirect(`/${req.params.id}_qr.png`);
    }, timeQR);
  }
});

export default clientRouter;
