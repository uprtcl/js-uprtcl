import { Dictionary } from '@uprtcl/micro-orchestrator';

import { CASSource, defaultCidConfig } from '@uprtcl/multiplatform';

export class MockSource implements CASSource {
  casID = 'mock';
  cidConfig = defaultCidConfig;

  constructor(protected objects: Dictionary<any> = {}) {}

  async ready(): Promise<void> {}

  async get(hash: string): Promise<any> {
    return this.objects[hash];
  }

  addObject(hash: string, object: object): void {
    this.objects[hash] = object;
  }
}
