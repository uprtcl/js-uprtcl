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

export function cidConfigOf(cidStr: string): CidConfig {
  let cid = new CID(cidStr);
  let multihash = multihashing.multihash.decode(cid.multihash);

  return {
    base: cid.multibaseName,
    version: cid.version,
    codec: cid.codec,
    type: multihash.name,
  };
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

/** verify that the reference entities that have a hash were created with the same hash */
export function validateEntities(entities: Entity[], references: EntityCreate[]) {
  references.map((ref) => {
    if (ref.id) {
      const entity = entities.find((e) => e.id === ref.id);
      if (!entity) {
        console.error(`Entity ${ref.id} not found on entity set`, { entities, references });
        throw new Error(`Entity ${JSON.stringify(ref)} not found in entity set`);
      }
    }
  });
}
