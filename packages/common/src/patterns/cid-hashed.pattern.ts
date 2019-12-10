import { injectable } from 'inversify';
import multihashing from 'multihashing-async';
import * as Cid from 'cids';

import { Transformable, Pattern, Hashed, Hashable } from '@uprtcl/cortex';
import { CidConfig, defaultCidConfig } from '@uprtcl/connections';

import { sortObject } from '../utils/utils';

export function recognizeHashed(object: object) {
  return (
    object.hasOwnProperty('id') &&
    typeof object['id'] === 'string' &&
    object.hasOwnProperty('object')
  );
}

@injectable()
export class CidHashedPattern implements Pattern, Hashable<any>, Transformable<[any], Hashed<any>> {
  recognize(object: object) {
    return recognizeHashed(object);
  }

  async hashObject(object: object, config: CidConfig): Promise<string> {
    const ordered = sortObject(object);

    const b = multihashing.Buffer.from(JSON.stringify(ordered));
    const encoded = await multihashing(b, config.type);

    const cid = new Cid(config.version, config.codec, encoded, config.base);
    return cid.toString();
  }

  validate = async <T extends object>(object: Hashed<T>): Promise<boolean> => true;

  derive = () => async <T extends object>(object: T): Promise<Hashed<T>> => {
    const hash = await this.hashObject(object, defaultCidConfig);

    return {
      id: hash,
      object: object
    };
  };

  extract<T>(hashed: Hashed<T>): T {
    return hashed.object;
  }

  transform(hashed: Hashed<any>): [any] {
    return [hashed.object];
  }
}
