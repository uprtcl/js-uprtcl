import {
  CidConfig,
  defaultCidConfig,
  CASStore,
  Connection,
  ConnectionOptions
} from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { CASStoreLocalDB } from './local.store.db';

export interface PutConfig {
  format: string;
  hashAlg: string;
  cidVersion: number;
  pin?: boolean;
}

export class LocalStore extends Connection implements CASStore {
  logger = new Logger('LocalStore');

  db: CASStoreLocalDB;
  casID = 'local';

  constructor(
    public cidConfig: CidConfig = defaultCidConfig,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
    this.db = new CASStoreLocalDB('casstore-local');
  }

  create(object: object): Promise<string> {
    const entity = await hashObject(object), this.cidConfig);
    return this.db.entities.put(entity);
  }

  async get(hash: string): Promise<object | undefined> {
    return this.db.entities.get(hash)
  }
}
