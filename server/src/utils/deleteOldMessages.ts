import { IRepoMessage } from '../interfaces/message';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';
import RepoMessage from '../models/repoMessage';

export async function deleteOldMessages(daysBack = 5) {
  const database = await databasePromise;
  const dateRef = dayLib().subtract(daysBack, 'day').format('YYYY-MM-DD HH:mm:ss.SSS');

  const messages = await database.query<IRepoMessage>(
    `SELECT m.id AS msg_id, cc.chat_id, cc.client_id FROM messages m
    JOIN clients_chats cc ON cc.key = m.chat_id
    WHERE m.created_at <= $1`,
    [dateRef],
  );

  await Promise.all(
    messages.map(async (msg) => {
      const repoMsg = new RepoMessage(7, msg.msg_id, msg.chat_id, msg.client_id);
      return await repoMsg.save();
    }),
  );
}
