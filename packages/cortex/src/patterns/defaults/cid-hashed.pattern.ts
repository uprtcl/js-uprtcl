import { injectable } from 'inversify';
import multihashing from 'multihashing-async';
import * as Cid from 'cids';

import { HashedPattern, Hashed } from '../patterns/hashed.pattern';
import { TransformPattern } from '../patterns/transform.pattern';
import { Pattern } from '../pattern';

export interface CidConfig {
  base?: string;
  version: number;
  codec: string;
  type: string;
}

export const defaultCidConfig: CidConfig = {
  version: 1,
  type: 'sha2-256',
  codec: 'dag-pb',
  base: 'base58btc'
};

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

  async hashObject(object: object, config: CidConfig): Promise<string> {
    const b = multihashing.Buffer.from(JSON.stringify(object, Object.keys(object).sort()));
    const encoded = await multihashing(b, config.type);

    const cid = new Cid(config.version, config.codec, encoded, config.base);
    return cid.toString();
  }

  validate<T extends object>(object: Hashed<T>): boolean {
    return true;
  }

  async derive<T>(object: T): Promise<Hashed<T>> {
    const ordered = {};
    Object.keys(object)
      .sort()
      .forEach(function(key) {
        ordered[key] = object[key];
      });

    const b = multihashing.Buffer.from(JSON.stringify(ordered));
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

  transform(hashed: Hashed<any>): [any] {
    return [hashed.object];
  }
}
