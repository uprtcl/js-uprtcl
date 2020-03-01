import { Dictionary } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';

import { Source } from '../../src/types/source';

export class MockSource implements Source {
  hashRecipe: any;
  objects: Dictionary<Hashed<any>> = {};
  source = '';

  async ready(): Promise<void> {}

  async get(hash: string): Promise<Hashed<any>> {
    return this.objects[hash];
  }

  addObject(hash: string, object: object): void {
    this.objects[hash] = <Hashed<any>>{
      id: hash,
      object
    };
  }
}
