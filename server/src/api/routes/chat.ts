import { GroupParticipant } from 'whatsapp-web.js';
import { Request, Response, Router } from 'express';

import { formatDate } from '../../utils/formatDate';
import { IChatWpp } from '../../interfaces/chat';
import { listChatByClientId } from '../../utils/listChatByClientId';
import { listParticipants } from '../../utils/listParticipants';
import databaseWhatsappPromise from '../../db/whatsapp';

const chatRouter = Router();

chatRouter.get('', async (req: Request, res: Response) => {
  const clientId = req.client.getInfo().id;

  const chats = await listChatByClientId(clientId);

  res.json(chats);
});

chatRouter.get('/:chat_id', async (req: Request, res: Response) => {
  const database = await databaseWhatsappPromise;
  const clientId = req.client.getInfo().id;
  const chatId = req.params.chat_id;

  const chat = await database.query(
    `SELECT
    c.id AS chat_id,
    c."name" AS chat_name,
    c.is_group,
    c.profile_pic_url AS chat_profile_pic_url,
    cc.unread_count,
    m.id AS message_id,
    m.body AS message_body,
    m.from_me,
    s.id AS status_id,
    s."name" AS status_name,
    COALESCE(sender.id, null) AS sender_id,
    COALESCE(sender."name", null) AS sender_name,
    COALESCE(sender.is_group, null) AS sender_is_group,
    COALESCE(sender.profile_pic_url, null) AS sender_profile_pic_url,
    m.created_at AS last_message_time,
    COALESCE(media.id, null) AS media_id,
    COALESCE(media.mime_type, null) AS media_mime_type,
    COALESCE(media.path, null) AS media_path,
    COALESCE(media.is_down, null) AS media_is_down
FROM
    clients_chats cc
JOIN
    chats c ON cc.chat_id = c.id
JOIN
    messages m ON m.chat_id = cc."id"
JOIN
    status_types s ON s.id = m.status_id
LEFT JOIN
    chats sender ON m.from_id = sender.id
LEFT JOIN
    medias media ON m.media_id = media.id
WHERE
    cc.client_id = $1
    AND cc.chat_id = $2
AND
    m.id = (
        SELECT sub_m.id
        FROM messages sub_m
        WHERE sub_m.chat_id = m.chat_id
        AND sub_m.type NOT IN ('vcard', 'gp2', 'revoked', 'ciphertext', 'e2e_notification', 'interactive', 'notification_template', 'protocol', 'call_log')
        ORDER BY sub_m.created_at DESC
        LIMIT 1
    )
ORDER BY
    last_message_time DESC;`,
    [clientId, chatId],
  );

  if (chat.length > 0) {
    const participants = chat[0].is_group
      ? await listParticipants(chat[0].chat_id)
      : undefined;

    const result = {
      id: chat[0].chat_id,
      name: chat[0].chat_name,
      is_group: chat[0].is_group,
      profile_pic_url: chat[0].chat_profile_pic_url,
      unread_count: chat[0].unread_count,
      ...formatDate(chat[0].last_message_time),
      message: {
        id: chat[0].message_id,
        body: chat[0].message_body,
        from_me: chat[0].from_me,
        ...formatDate(chat[0].last_message_time),
        status: { id: chat[0].status_id, name: chat[0].status_name },
        from: chat[0].sender_id
          ? {
            id: chat[0].sender_id,
            name: chat[0].sender_name,
            is_group: chat[0].sender_is_group,
            profile_pic_url: chat[0].sender_profile_pic_url,
          }
          : undefined,
        media: chat[0].media_id
          ? {
            id: chat[0].media_id,
            mime_type: chat[0].media_mime_type,
            path: chat[0].media_path,
            is_down: chat[0].media_is_down,
          }
          : undefined,
      },
      participants,
    };

    res.json(result);
    return;
  }

  res.status(404).json('Not Found');
});

chatRouter.get('/:chat_id/wpp', async (req: Request, res: Response) => {
  const clientWpp = req.client.getWpp();
  const id = req.params.chat_id;
  const chat = await clientWpp.getChatById(id);

  const { name, isGroup, unreadCount } = chat;

  const chatData: IChatWpp = {
    id,
    name,
    isGroup,
    unreadCount,
  };

  const contact = await clientWpp.getContactById(id);
  chatData.profilePicUrl = await contact.getProfilePicUrl();
  if (!isGroup) {
    chatData.name = contact.pushname;
  }

  if (!name) {
    chatData.name = contact.name || contact.number;
  }

  if (isGroup) {
    const chatGroupWpp = chat as unknown as {
      groupMetadata: { participants: GroupParticipant[] };
    };

    if (chatGroupWpp.groupMetadata.participants) {
      chatData.participants = chatGroupWpp.groupMetadata.participants.map(
        (ct) => ct.id._serialized,
      );
    }
  }

  res.json(chatData);
});

chatRouter.get('/:chat_id/wpp/messages', async (req: Request, res: Response) => {
  const clientWpp = req.client.getWpp();
  const chat = await clientWpp.getChatById(req.params.chat_id);

  const messages = await chat.fetchMessages({ limit: 50 });

  res.json({ ...chat, messages });
});

chatRouter.get('/:chat_id/messages', async (req: Request, res: Response) => {
  const database = await databaseWhatsappPromise;
  const clientId = req.client.getInfo().id;
  const chatId = req.params.chat_id;

  const messages = await database.query(
    `SELECT
    m.id AS message_id,
    m.body AS message_body,
    m.from_me,
    m.created_at AS message_created_at,
    s.id AS status_id,
    s."name" AS status_name,
    COALESCE(sender.id, null) AS sender_id,
    COALESCE(sender."name", null) AS sender_name,
    COALESCE(sender.is_group, null) AS sender_is_group,
    COALESCE(sender.profile_pic_url, null) AS sender_profile_pic_url,
    COALESCE(media.id, null) AS media_id,
    COALESCE(media.mime_type, null) AS media_mime_type,
    COALESCE(media.path, null) AS media_path,
    COALESCE(media.is_down, null) AS media_is_down
FROM
    clients_chats cc
JOIN
    messages m ON m.chat_id = cc."id"
JOIN
    status_types s ON s.id = m.status_id
LEFT JOIN
    chats sender ON m.from_id = sender.id
LEFT JOIN
    medias media ON m.media_id = media.id
WHERE
    cc.client_id = $1
    AND cc.chat_id = $2
    AND m.type NOT IN ('vcard', 'gp2', 'revoked', 'ciphertext', 'e2e_notification', 'interactive', 'notification_template', 'protocol', 'call_log')
ORDER BY
    m.created_at ASC;`,
    [clientId, chatId],
  );

  const result = messages.map((row) => ({
    id: row.message_id,
    body: row.message_body,
    from_me: row.from_me,
    ...formatDate(row.message_created_at),
    status: { id: row.status_id, name: row.status_name },
    from: row.sender_id
      ? {
        id: row.sender_id,
        name: row.sender_name,
        is_group: row.sender_is_group,
        profile_pic_url: row.sender_profile_pic_url,
      }
      : undefined,
    media: row.media_id
      ? {
        id: row.media_id,
        mime_type: row.media_mime_type,
        path: row.media_path,
        is_down: row.media_is_down,
      }
      : undefined,
  }));

  res.json(result);
});

export default chatRouter;
