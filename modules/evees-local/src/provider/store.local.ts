import {
  CidConfig,
  defaultCidConfig,
  CASStore,
  Connection,
  ConnectionOptions
} from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

import { CASStoreLocalDB } from './store.local.db';
import { hashObject } from '@uprtcl/evees';

export interface PutConfig {
  format: string;
  hashAlg: string;
  cidVersion: number;
  pin?: boolean;
}

export class CASStoreLocal extends Connection implements CASStore {
  logger = new Logger('LocalStore');

  db: CASStoreLocalDB;
  casID = 'local';

  constructor(
    private name: string = 'cas-store',
    public cidConfig: CidConfig = defaultCidConfig,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
    this.db = new CASStoreLocalDB(this.name);
  }

  async connect() {}

  async create(object: object): Promise<string> {
    const id = await hashObject(object, this.cidConfig);
    return this.db.entities.put({
      id,
      object
    });
  }

  async get(hash: string): Promise<object | undefined> {
    const entity = await this.db.entities.get(hash);
    return entity ? entity.object : undefined;
  }
}
