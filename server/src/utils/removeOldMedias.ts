import { IMedia } from '../interfaces/media';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';
import Media from '../models/media';

export async function removeOldMedias(daysBack = 5) {
  const database = await databasePromise;
  const dateRef = dayLib().subtract(daysBack, 'day').format('YYYY-MM-DD HH:mm:ss.SSS');

  const medias = await database.query<IMedia>(
    `SELECT m2.* FROM messages m
    JOIN medias m2 ON m2.id = m.media_id
    WHERE m.created_at <= $1 AND m2.is_down = true`,
    [dateRef],
  );

  for (const mediaData of medias) {
    const { data, id, mime_type, path } = mediaData;
    const media = new Media(mime_type, data, path, id);
    await media.remove();
  }
}
