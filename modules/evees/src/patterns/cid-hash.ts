import multihashing from 'multihashing-async';
import CBOR from 'cbor-js';
import CID from 'cids';

import { sortObject } from '@uprtcl/ipfs-provider';
import { CidConfig, defaultCidConfig } from '@uprtcl/multiplatform';

export function recognizeHashed(object: object) {
  return (
    object.hasOwnProperty('id') &&
    typeof object['id'] === 'string' &&
    object.hasOwnProperty('object')
  );
}

export async function hashObject(object: object, config: CidConfig = defaultCidConfig): Promise<string> {
  const sorted = sortObject(object);
  const buffer = CBOR.encode(sorted);
  const encoded = await multihashing(buffer, config.type);

  const cid = new CID(config.version, config.codec, encoded, config.base);

  return cid.toString();
}
