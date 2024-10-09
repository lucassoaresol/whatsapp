import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';

export async function deleteOldVotes(daysBack = 5) {
  const database = await databasePromise;
  const dateRef = dayLib().subtract(daysBack, 'day').format('YYYY-MM-DD HH:mm:ss.SSS');

  await database.query('DELETE FROM votes WHERE created_at <= $1', [dateRef]);
}
