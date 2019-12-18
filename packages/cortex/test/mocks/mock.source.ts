import { Dictionary } from 'lodash-es';

import { Source, Hashed } from '../../src/uprtcl-cortex';

export class MockSource implements Source {
  objects: Dictionary<Hashed<any>> = {};

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
