import { injectable } from 'inversify';
import multihashing from 'multihashing-async';
import CBOR from 'cbor-js';
import CID from 'cids';

import { Transformable, Pattern, Hashed, Hashable } from '@uprtcl/cortex';
import { CidConfig,  sortObject } from '@uprtcl/ipfs-provider';
import { Logger } from '@uprtcl/micro-orchestrator';

export function recognizeHashed(object: object) {
  return (
    object.hasOwnProperty('id') &&
    typeof object['id'] === 'string' &&
    object.hasOwnProperty('object')
  );
}

const logger = new Logger('CidHashedPattern');

@injectable()
export class CidHashedPattern implements Pattern, Hashable<any>, Transformable<[any], Hashed<any>> {
  recognize(object: object) {
    return recognizeHashed(object);
  }

  async hashObject(object: object, config: CidConfig): Promise<string> {
    
    const sorted = sortObject(object);
    const buffer = CBOR.encode(sorted);
    const encoded = await multihashing(buffer, config.type);

    const cid = new CID(config.version, config.codec, encoded, config.base);

    logger.log(`hashed object:`, {object, sorted, buffer, config, cid, cidStr: cid.toString()});

    return cid.toString();
  }

  validate = async <T extends object>(object: Hashed<T>): Promise<boolean> => true;

  derive = () => async <T extends object>(object: T, cidConfig: CidConfig): Promise<Hashed<T>> => {
    const hash = await this.hashObject(object, cidConfig);

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
