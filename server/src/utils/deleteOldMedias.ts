import { IMedia } from '../interfaces/media';
import databasePromise from '../libs/database';
import dayLib from '../libs/dayjs';
import Media from '../models/media';

export async function deleteOldMedias(daysBack = 5) {
  const database = await databasePromise;
  const dateRef = dayLib().subtract(daysBack, 'day').format('YYYY-MM-DD HH:mm:ss.SSS');

  const medias = await database.query<IMedia>(
    'SELECT * FROM medias WHERE updated_at <= $1',
    [dateRef],
  );

  for (const media of medias) {
    const mediaData = new Media(media.mime_type, media.data, media.path, media.id);

    await mediaData.destroy();
  }
}
