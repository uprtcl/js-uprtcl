import multihashing from 'multihashing-async';
import CBOR from 'cbor-js';
import CID from 'cids';
import { Signed, Entity } from '@uprtcl/cortex';
import { sortObject } from '@uprtcl/ipfs-provider';
import { CidConfig, defaultCidConfig } from '@uprtcl/multiplatform';

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
  config: CidConfig = defaultCidConfig
): Promise<Entity<O>> {
  const hash = await hashObject(object, config);
  return {
    id: hash,
    object,
    casID: undefined,
  };
}
