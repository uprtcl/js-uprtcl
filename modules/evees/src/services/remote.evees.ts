import { Lens } from '@uprtcl/lenses';

import { Perspective } from '../types';
import { Secured } from '../utils/cid-hash';
import { Client } from './client';
import { RemoteLogged } from './remote.logged';

/** A remote is a Client that connects to backend, identified with an id */
export interface EveesRemote extends Client, RemoteLogged {
  getHome?(userId?: string): Promise<Secured<Perspective>>;
}
