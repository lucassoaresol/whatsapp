/* eslint-disable @typescript-eslint/naming-convention */

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
