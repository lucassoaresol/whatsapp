import { CronJob } from "cron";

import { runShellScript } from "../utils/runShellScript";

import { deleteOldVotes } from "./jobs/deleteOldVotes";
import { removeOldMedias } from "./jobs/removeOldMedias";

CronJob.from({
  cronTime: "0 0 * * *",
  onTick: async () => {
    await Promise.all([removeOldMedias(10), deleteOldVotes()]);
    const dirs = ["logs"];
    dirs.forEach((el) =>
      runShellScript(`find ${el} -type f -mtime +5 -exec rm {} \\;`),
    );
  },
  start: true,
});
