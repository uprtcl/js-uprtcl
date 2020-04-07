import { Dictionary } from '@uprtcl/micro-orchestrator';

import { CidConfig, CASStore, defaultCidConfig } from '@uprtcl/multiplatform';

export class MockStore implements CASStore {
  casID = 'hi';
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
