import databaseWhatsappPromise from '../../db/whatsapp';
import dayLib from '../../libs/dayjs';

export async function deleteOldVotes(daysBack = 5) {
  const database = await databaseWhatsappPromise;
  const dateRef = dayLib().subtract(daysBack, 'day').format('YYYY-MM-DD HH:mm:ss.SSS');

  await database.deleteFromTable({
    table: 'votes',
    where: { created_at: { lte: dateRef } },
  });
}
