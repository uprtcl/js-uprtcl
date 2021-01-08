import { Perspective } from '../types';
import { Secured } from '../utils/cid-hash';
import { AccessControl } from './access-control';
import { Client } from './client';
import { Proposals } from './proposals';
import { RemoteLogged } from './remote.logged';

/** A remote is a Client that connects to backend, identified with an id */
export interface RemoteEvees extends Client, RemoteLogged {
  accessControl: AccessControl;
  proposals?: Proposals;

  getHome?(userId?: string): Promise<Secured<Perspective>>;
}
