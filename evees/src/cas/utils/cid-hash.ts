import multihashing from 'multihashing-async';
import CBOR from 'cbor-js';
import CID from 'cids';

import { CidConfig, defaultCidConfig } from '../../cas/interfaces/cid-config';
import { Signed } from '../../patterns/interfaces/signable';
import { Entity, EntityCreate } from '../interfaces/entity';

export function sortObject(object: object): object {
  if (typeof object !== 'object' || object instanceof Array || object === null) {
    // Not to sort the array
    return object;
  }
  const keys = Object.keys(object).sort();

  const newObject = {};
  for (let i = 0; i < keys.length; i++) {
    newObject[keys[i]] = sortObject(object[keys[i]]);
  }
  return newObject;
}

export async function hashObject(
  object: object,
  config: CidConfig = defaultCidConfig
): Promise<string> {
  const sorted = sortObject(object);
  const buffer = CBOR.encode(sorted);
  const encoded = await multihashing(buffer, config.type);

  const cid = new CID(config.version, config.codec, encoded, config.base);

  return cid.toString();
}

export type Secured<T> = Entity<Signed<T>>;

export async function deriveEntity<O extends object>(
  object: O,
  config: CidConfig = defaultCidConfig,
  casID: string
): Promise<Entity<O>> {
  const hash = await hashObject(object, config);
  return {
    id: hash,
    object,
    casID,
  };
}
