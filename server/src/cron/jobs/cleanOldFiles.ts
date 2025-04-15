import { exec } from 'node:child_process';

export function cleanOldFiles(directory: string) {
  const command = `find ${directory} -type f -mtime +5 -exec rm {} \\;`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao limpar '${directory}': ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro ao limpar '${directory}': ${stderr}`);
      return;
    }
    console.log(`Arquivos antigos removidos de '${directory}'.`);
  });
}
