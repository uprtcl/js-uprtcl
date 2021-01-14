import { Secured } from '../../cas/utils/cid-hash';

import { Client } from './client';
import { AccessControl } from './access-control';
import { Proposals } from './proposals';
import { RemoteLogged } from './remote.logged';
import { PartialPerspective, Perspective, PerspectiveLinks } from './types';

/** A remote is a Client that connects to backend, identified with an id */
export interface RemoteEvees extends Client, RemoteLogged {
  accessControl: AccessControl;
  proposals?: Proposals;

  snapPerspective(
    perspective: PartialPerspective,
    links?: PerspectiveLinks
  ): Promise<Secured<Perspective>>;

  getHome?(userId?: string): Promise<Secured<Perspective>>;
}
