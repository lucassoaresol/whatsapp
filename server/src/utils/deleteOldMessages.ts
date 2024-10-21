import { IMedia } from '../interfaces/media';
import { IMessage } from '../interfaces/message';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';
import Media from '../models/media';

export async function deleteOldMessages(daysBack = 5) {
  const database = await databasePromise;
  const dateRef = dayLib().subtract(daysBack, 'day').format('YYYY-MM-DD HH:mm:ss.SSS');

  const messages = await database.query<IMessage>(
    'SELECT id, media_id FROM messages WHERE created_at <= $1',
    [dateRef],
  );

  for (const msg of messages) {
    if (msg.media_id) {
      const mediaData = await database.findFirst<IMedia>({
        table: 'medias',
        where: { id: msg.media_id },
      });

      if (mediaData) {
        const media = new Media(
          mediaData.mime_type,
          mediaData.data,
          mediaData.path,
          msg.media_id,
        );

        await media.destroy();
      }
    } else {
      await database.deleteFromTable({ table: 'messages', where: { id: msg.id } });
    }
  }
}
