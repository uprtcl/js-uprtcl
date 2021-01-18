import { Ready } from '../../utils/ready';

import { CASStore } from './cas-store';
import { CidConfig } from './cid-config';

export interface CASRemote extends CASStore, Ready {
  casID: string;
  cidConfig: CidConfig;
}
