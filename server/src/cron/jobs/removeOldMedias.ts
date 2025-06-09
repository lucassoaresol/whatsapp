import { IMedia } from '../../interfaces/media';
import databaseWhatsappPromise from '../../db/whatsapp';
import dayLib from '../../libs/dayjs';
import Media from '../../models/media';

export async function removeOldMedias(daysBack = 5) {
  const database = await databaseWhatsappPromise;
  const dateRef = dayLib().subtract(daysBack, 'day').format('YYYY-MM-DD HH:mm:ss.SSS');

  const medias = await database.findMany<IMedia>({
    table: 'messages',
    joins: [{ table: 'medias', on: { media_id: 'id' } }],
    where: { created_at: { lte: dateRef }, 'm1.is_down': true },
    select: {
      'm1.id AS id': true,
      'm1.mime_type AS mime_type': true,
      'm1.data AS data': true,
      'm1.path AS path': true,
    },
  });

  for (const mediaData of medias) {
    const { data, id, mime_type, path } = mediaData;
    const media = new Media(mime_type, data, path, id);
    await media.remove();
  }
}
