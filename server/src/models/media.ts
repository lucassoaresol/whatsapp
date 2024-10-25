import { unlink } from 'node:fs';
import { writeFile } from 'node:fs/promises';

import databasePromise from '../libs/database';

class Media {
  constructor(
    private mimeType: string,
    private data: string,
    private path: string,
    private id?: number,
  ) {}

  public async save() {
    const database = await databasePromise;

    const imgDTO = await database.insertIntoTable({
      table: 'medias',
      dataDict: { mime_type: this.mimeType, data: this.data, path: this.path },
      select: { id: true },
    });

    const imgData = imgDTO as { id: number };
    this.id = imgData.id;

    return imgData.id;
  }

  public async down() {
    try {
      const fileName = `./public/${this.path}`;

      const [database] = await Promise.all([
        databasePromise,
        writeFile(fileName, this.data, { encoding: 'base64' }),
      ]);

      await database.updateIntoTable({
        table: 'medias',
        dataDict: { is_down: true },
        where: { id: this.id },
      });

      console.log(`Arquivo salvo como ${fileName}`);
    } catch (error) {
      console.error('Erro ao baixar ou salvar o arquivo:', error);
    }
  }

  public async destroy() {
    const fileName = `./public/${this.path}`;

    const database = await databasePromise;

    unlink(fileName, async (err) => {
      if (err) {
        console.error(`Erro ao deletar o arquivo ${fileName}:`, err);
      } else {
        await database.deleteFromTable({
          table: 'medias',
          where: { id: this.id },
        });
        console.log(`Arquivo deletado: ${fileName}`);
      }
    });
  }
}

export default Media;
