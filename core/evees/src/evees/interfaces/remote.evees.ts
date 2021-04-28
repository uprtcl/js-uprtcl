import { Secured } from '../utils/cid-hash';

import { Client } from './client';
import { AccessControl } from './access-control';
import { RemoteLogged } from './remote.logged';
import { PartialPerspective, Perspective } from './types';
import { Proposals } from '../proposals/proposals';

/** A remote is a Client that connects to backend, identified with an id */
export interface RemoteEvees extends Client, RemoteLogged {
  accessControl: AccessControl;
  proposals?: Proposals;

  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>>;
}
