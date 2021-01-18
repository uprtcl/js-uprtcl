import { Connection } from '../../utils/connection';

import { CASStore } from './cas-store';
import { CidConfig } from './cid-config';

export interface CASRemote extends CASStore, Connection {
  casID: string;
  cidConfig: CidConfig;
}
