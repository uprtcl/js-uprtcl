import { Secured } from '../../cas/utils/cid-hash';
import { CASRemote } from '../../cas/interfaces/cas-remote';
import { CASStore } from '../../cas/interfaces/cas-store';

import { Client } from './client';
import { AccessControl } from './access-control';
import { RemoteLogged } from './remote.logged';
import { PartialPerspective, Perspective } from './types';
import { Proposals } from '../proposals/proposals';

/** A remote is a Client that connects to backend, identified with an id */
export interface RemoteEvees extends Client, RemoteLogged {
  accessControl: AccessControl;
  proposals?: Proposals;

  /** The id of the CASRemote where objects of this Remote should be
   * persisted */
  casID: string;

  /** a method to set the CASStore to be used to fetch entities after
   * this service contruction */
  setStore(store: CASStore);

  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>>;
}
