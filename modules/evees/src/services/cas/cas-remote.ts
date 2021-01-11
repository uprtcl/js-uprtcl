import { CASStore } from './cas-store';
import { CidConfig } from './cid-config';

export interface CASRemote extends CASStore {
  casID: string;
  cidConfig: CidConfig;
}
