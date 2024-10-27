import { Request, Response, Router } from 'express';
import Whatsapp from 'whatsapp-web.js';

import dayLib from '../../libs/dayjs';
import { formatDate } from '../../utils/formatDate';

const { Poll } = Whatsapp;

const messageRouter = Router();

messageRouter.post('', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const quotedMessageId = req.body.message_id || undefined;
  const mentions = req.body.mentions || undefined;
  const message = await client.sendMessage(req.body.number, req.body.message, {
    linkPreview: false,
    quotedMessageId,
    mentions,
  });

  const created_at = dayLib(message.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss.SSS');

  const result = {
    id: message.id._serialized,
    body: message.body,
    from_me: true,
    ...formatDate(created_at),
    status: { id: 1, name: 'created' },
  };

  res.status(201).json(result);
});

messageRouter.post('/poll', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const poll = new Poll(req.body.pollName, req.body.pollOptions, {
    messageSecret: req.body.messageSecret,
  });

  const message = await client.sendMessage(req.body.number, poll);
  await client.interface.openChatWindow(req.body.number);

  res.status(201).json(message);
});

messageRouter.post(
  '/:chat_id/contact/:contact_id',
  async (req: Request, res: Response) => {
    const client = req.client.getWpp();
    const contact = await client.getContactById(req.params.contact_id);
    const message = await client.sendMessage(req.params.chat_id, contact);

    res.status(201).json(message);
  },
);

messageRouter.get('', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const body = String(req.query.body) || '';
  const chatId = String(req.query.chatId) || undefined;
  const page = +String(req.query.page) || undefined;
  const limit = +String(req.query.limit) || undefined;

  const message = await client.searchMessages(body, { chatId, page, limit });

  res.json(message);
});

messageRouter.get('/:msg_id', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const message = await client.getMessageById(req.params.msg_id);

  res.json(message);
});

messageRouter.patch('/:msg_id', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const message = await client.getMessageById(req.params.msg_id);

  await message.react(req.body.icon);

  res.json(message);
});

messageRouter.delete('/:msg_id', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const message = await client.getMessageById(req.params.msg_id);

  await message.delete(true);

  res.json(message);
});

export default messageRouter;
