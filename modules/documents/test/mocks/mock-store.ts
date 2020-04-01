import { Dictionary } from '@uprtcl/micro-orchestrator';

import { CidConfig, CASStore } from '@uprtcl/multiplatform';

export class MockStore implements CASStore {
  casID = '';
  cidConfig: CidConfig;

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
