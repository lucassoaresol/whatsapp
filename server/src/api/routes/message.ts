import { Request, Response, Router } from 'express';
import mime from 'mime-types';
import Whatsapp from 'whatsapp-web.js';

import dayLib from '../../libs/dayjs';
import { formatDate } from '../../utils/formatDate';

const { Poll, MessageMedia } = Whatsapp;

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

messageRouter.post('/media', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const media = await MessageMedia.fromUrl(req.body.mediaUrl);

  const message = await client.sendMessage(req.body.number, media, {
    caption: req.body.caption,
  });

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
  const id = req.params.msg_id;
  const message = await client.getMessageById(id);

  if (message) {
    const timestamp =
      dayLib(message.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss.SSS') ===
        'Invalid Date'
        ? undefined
        : dayLib(message.timestamp * 1000).format('YYYY-MM-DD HH:mm:ss.SSS');

    res.json({
      id,
      timestamp,
      type: message.type,
      body: message.body,
      fromMe: message.fromMe,
      hasMedia: message.hasMedia,
    });
  }

  res.status(404).json('message not found');
});

messageRouter.get('/:msg_id/contact', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const id = req.params.msg_id;
  const message = await client.getMessageById(id);

  const contact = await message.getContact();

  res.json({ ...contact, id: contact.id._serialized });
});

messageRouter.get('/:msg_id/media', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const id = req.params.msg_id;
  const message = await client.getMessageById(id);

  const media = await message.downloadMedia();

  if (media) {
    const mimeType = media.mimetype;
    const extension = mime.extension(mimeType);
    const fileName = `${req.client.getInfo().id}_${Date.now()}.${extension}`;

    res.json({ mimeType, fileName, data: media.data });
  } else {
    res.status(404).json('media not found');
  }
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
