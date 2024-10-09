import { Request, Response, Router } from 'express';

import { formatTimestamp } from '../../utils/formatTimestamp';

const chatRouter = Router();

chatRouter.get('', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const chats = await client.getChats();

  const result = await Promise.all(
    chats.map(async (ch) => {
      let name = ch.name;
      if (!ch.isGroup) {
        name = (await client.getContactById(ch.id._serialized)).pushname;
      }
      const messages = await Promise.all(
        (await ch.fetchMessages({ limit: 5 })).reverse().map((msg) => {
          return {
            id: msg.id._serialized,
            body: msg.body,
            fromMe: msg.fromMe,
            ...formatTimestamp(msg.timestamp),
            from: msg.author,
          };
        }),
      );
      return {
        id: ch.id._serialized,
        name,
        isGroup: ch.isGroup,
        unreadCount: ch.unreadCount,
        ...formatTimestamp(ch.timestamp),
        messages,
      };
    }),
  );

  res.json(result);
});

chatRouter.get('/:chat_id', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const chat = await client.getChatById(req.params.chat_id);

  const messages = await Promise.all(
    (await chat.fetchMessages({ limit: 5 })).reverse().map((msg) => {
      return {
        id: msg.id._serialized,
        body: msg.body,
        fromMe: msg.fromMe,
        ...formatTimestamp(msg.timestamp),
        from: msg.author,
      };
    }),
  );

  const result = {
    id: chat.id._serialized,
    name: chat.name,
    isGroup: chat.isGroup,
    unreadCount: chat.unreadCount,
    ...formatTimestamp(chat.timestamp),
    messages,
  };

  res.json(result);
});

chatRouter.get('/:chat_id/messages', async (req: Request, res: Response) => {
  const client = req.client.getWpp();
  const chat = await client.getChatById(req.params.chat_id);
  const messages = await chat.fetchMessages({
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  const result = await Promise.all(
    messages.reverse().map(async (msg) => {
      let from = undefined;
      if (msg.author) {
        const msgChat = await client.getContactById(msg.author);
        from = {
          id: msgChat.id._serialized,
          name: msgChat.pushname,
        };
      }
      return {
        id: msg.id._serialized,
        body: msg.body,
        fromMe: msg.fromMe,
        ...formatTimestamp(msg.timestamp),
        from,
      };
    }),
  );

  res.json(result);
});

export default chatRouter;
