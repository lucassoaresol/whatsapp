import databasePromise from '../libs/database';

import { formatDate } from './formatDate';
import { listParticipants } from './listParticipants';

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
    messages m ON m.chat_id = cc."key"
JOIN
    status_types s ON s.id = m.status_id
LEFT JOIN
    chats sender ON m.from_id = sender.id
LEFT JOIN
    medias media ON m.media_id = media.id
WHERE
    cc.client_id = $1
    AND m.id = (
        SELECT sub_m.id
        FROM messages sub_m
        WHERE sub_m.chat_id = m.chat_id
        AND sub_m.type NOT IN ('vcard', 'gp2', 'revoked', 'ciphertext', 'e2e_notification', 'interactive', 'notification_template', 'protocol', 'call_log')
        ORDER BY sub_m.created_at DESC
        LIMIT 1
    )
ORDER BY
    last_message_time DESC;`,
    [clientId],
  );

  const result = await Promise.all(
    chats.map(async (row) => ({
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
        ...formatDate(row.last_message_time),
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
      },
      participants: row.is_group ? await listParticipants(row.chat_id) : undefined,
    })),
  );

  return result;
}
