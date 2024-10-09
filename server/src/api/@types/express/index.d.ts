/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import Client from '../../../models/client';
import ClientManager from '../../../models/clientManager';

declare global {
  namespace Express {
    interface Request {
      client: Client;
      clientManager: ClientManager;
    }
  }
}
