import { Ready } from '../../utils/ready';

import { CASStore } from './cas-store';
import { CidConfig } from './cid-config';

export interface CASRemote extends CASStore, Ready {
  casID: string;
  // flag to know if entities of this store should or not be cloned when referenced
  isLocal: boolean;
  cidConfig: CidConfig;
}
