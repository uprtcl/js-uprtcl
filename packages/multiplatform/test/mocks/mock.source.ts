import { Dictionary } from '@uprtcl/micro-orchestrator';

import { CASSource } from '../../src/types/cas-source';

export class MockSource implements CASSource {
  casID = '';

  constructor(protected objects: Dictionary<any> = {}) {}

  async ready(): Promise<void> {}

  async get(hash: string): Promise<any> {
    return this.objects[hash];
  }

  addObject(hash: string, object: object): void {
    this.objects[hash] = <any>object;
  }
}
