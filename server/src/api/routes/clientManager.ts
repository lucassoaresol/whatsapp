import { Request, Response, Router } from 'express';

import chatRouter from './chat.js';
import messageRouter from './message.js';

const clientManagerRouter = Router();

clientManagerRouter.use('/chats', chatRouter);
clientManagerRouter.use('/messages', messageRouter);

clientManagerRouter.get(
  '/contacts/:contact_id',
  async (req: Request, res: Response) => {
    const client = req.client.getWpp();
    const contact = await client.getContactById(req.params.contact_id);
    const profilePicUrl = await contact.getProfilePicUrl();
    const result = { ...contact, profilePicUrl };

    res.json(result);
  },
);

clientManagerRouter.get('/number/:num_id', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const contact = await client.getNumberId(req.params.num_id);

  res.json(contact);
});

export default clientManagerRouter;
