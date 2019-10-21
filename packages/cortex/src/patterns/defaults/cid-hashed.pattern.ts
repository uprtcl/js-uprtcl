import { injectable } from 'inversify';
import multihashing from 'multihashing-async';
import * as Cid from 'cids';

import { HashedPattern, Hashed } from '../patterns/hashed.pattern';
import { TransformPattern } from '../patterns/transform.pattern';
import { Pattern } from '../pattern';

export function recognizeHashed(object: object) {
  return (
    object.hasOwnProperty('id') &&
    typeof object['id'] === 'string' &&
    object.hasOwnProperty('object')
  );
}

@injectable()
export class CidHashedPattern
  implements Pattern, HashedPattern<any>, TransformPattern<Hashed<any>, [any]> {
  recognize(object: object) {
    return recognizeHashed(object);
  }

  validate<T extends object>(object: Hashed<T>): boolean {
    return true;
  }

  async derive<T>(object: T): Promise<Hashed<T>> {
    const b = multihashing.Buffer.from(JSON.stringify(object));
    const encoded = await multihashing(b, 'sha2-256');

    const cid = new Cid(encoded);

    return {
      id: cid.toString(),
      object: object
    };
  }

  extract<T>(hashed: Hashed<T>): T {
    return hashed.object;
  }

  getCidConfig(hash: string): any {
    return null; // TODO fix this
  }

  transform(hashed: Hashed<any>): [any] {
    return [hashed.object];
  }
}
