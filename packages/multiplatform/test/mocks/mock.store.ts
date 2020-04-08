import { Dictionary } from '@uprtcl/micro-orchestrator';

import { CASStore } from '../../src/types/cas-store';
import { CidConfig, defaultCidConfig } from '../../src/types/cid-config';

export class MockSource implements CASStore {
  casID = 'local';
  cidConfig: CidConfig = defaultCidConfig;

  constructor(protected objects: Dictionary<any> = {}) {}

  async ready(): Promise<void> {}

  async get(hash: string): Promise<any> {
    return this.objects[hash];
  }

  async create(object: object, hash: string): Promise<string> {
    this.objects[hash] = <any>object;

    return hash;
  }
}
