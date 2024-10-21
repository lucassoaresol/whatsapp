import databasePromise from '../libs/database';

import { formatDate } from './formatDate';

export async function listChatByClientId(clientId: string) {
  const database = await databasePromise;

  const chats = await database.query(
    `SELECT
    c.id AS chat_id,
    c."name" AS chat_name,
    c.is_group,
    c.profile_pic_url AS chat_profile_pic_url,
    cc.unread_count,
    m.id AS message_id,
    m.body AS message_body,
    m.from_me,
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
    messages m ON m.chat_id = cc."key"
LEFT JOIN
    chats sender ON m.from_id = sender.id
LEFT JOIN
    medias media ON m.media_id = media.id
WHERE
    cc.client_id = $1
AND
    m.created_at = (
        SELECT MAX(sub_m.created_at)
        FROM messages sub_m
        WHERE sub_m.chat_id = m.chat_id
    )
GROUP BY
    c.id, c."name", c.is_group, c.profile_pic_url, cc.unread_count, m.id, m.body, m.from_me,
    sender.id, sender."name", sender.is_group, sender.profile_pic_url, media.id, media.mime_type,
    media.path, media.is_down, m.created_at
ORDER BY
    last_message_time DESC;`,
    [clientId],
  );

  const result = chats.map((row) => ({
    id: row.chat_id,
    name: row.chat_name,
    is_group: row.is_group,
    profile_pic_url: row.chat_profile_pic_url,
    unread_count: row.unread_count,
    ...formatDate(row.last_message_time),
    message: {
      id: row.message_id,
      body: row.message_body,
      from_me: row.from_me,
      created_at: row.last_message_time,
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
    },
  }));

  return result;
}
