import { Dictionary } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';

import { CASSource } from '@uprtcl/multiplatform';

export class MockSource implements CASSource {
  casID = '';

  constructor(protected objects: Dictionary<any> = {}) {}

  async ready(): Promise<void> {}

  async get(hash: string): Promise<Hashed<any>> {
    return this.objects[hash];
  }

  addObject(hash: string, object: object): void {
    this.objects[hash] = object;
  }
}
