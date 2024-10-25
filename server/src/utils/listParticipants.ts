import databasePromise from '../libs/database';

export async function listParticipants(groupId: string) {
  const database = await databasePromise;

  const participants = await database.query(
    `
  SELECT c.id, c."name", c.profile_pic_url FROM groups_chats gc
  JOIN chats c on c.id = gc.chat_id
  WHERE gc.group_id = $1`,
    [groupId],
  );

  return participants;
}
