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
  /** one store remote can be used on many RemoteEvees */
  /** the remote property is still available as a cached store for the RemoteEvees */
  storeRemote: CASRemote;

  accessControl: AccessControl;
  proposals?: Proposals;

  /** a method to set the CASStore to be used to fetch entities,
   * storeRemote is kept aside to persist entities. This seems to be
   * caused by the fact that remote ids are used to choose the CASRemote
   * where to store entities. It seems eaiery for the consumer app to know
   * the remoteId than the casId. Potential for better solutions. */
  setStore(store: CASStore);

  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>>;

  getHome?(userId?: string): Promise<Secured<Perspective>>;
}
