import databasePromise from '../libs/database';

export async function listParticipants(groupId: string) {
  const database = await databasePromise;

  const participants = await database.findMany({
    table: 'groups_chats',
    joins: [{ table: 'chats', on: { chat_id: 'id' } }],
    where: { group_id: groupId },
    orderBy: { 'c.name': 'ASC' },
    select: {
      'c.id AS id': true,
      'c.name AS name': true,
      'c.profile_pic_url AS profile_pic_url': true,
    },
  });

  return participants;
}
