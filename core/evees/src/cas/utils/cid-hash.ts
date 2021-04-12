import multihashing from 'multihashing-async';
import CBOR from 'cbor-js';
import CID from 'cids';

import { CidConfig, defaultCidConfig } from '../../cas/interfaces/cid-config';
import { Signed } from '../../patterns/interfaces/signable';
import { Entity, EntityCreate } from '../interfaces/entity';
import { Logger } from 'src/utils/logger';

export type Secured<T> = Entity<Signed<T>>;

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

const logger = new Logger('hashObject()');
const LOGINFO_HASH = false;

export async function hashObject(
  object: object,
  config: CidConfig = defaultCidConfig
): Promise<string> {
  const sorted = sortObject(object);
  const buffer = CBOR.encode(sorted);
  const encoded = await multihashing(buffer, config.type as any);

  const cid = new CID(config.version, config.codec, encoded, config.base);
  const cidStr = cid.toString();
  if (LOGINFO_HASH)
    logger.log('hash', { cidStr: cid.toString(), object, sorted, buffer, encoded, cid });

  return cidStr;
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

const constants: [string, number][] = [
  ['base8', 37],
  ['base10', 39],
  ['base16', 66],
  ['base32', 62],
  ['base32pad', 63],
  ['base32hex', 76],
  ['base32hexpad', 74],
  ['base32z', 68],
  ['base58flickr', 90],
  ['base58btc', 122],
  ['base64', 109],
  ['base64pad', 77],
  ['base64url', 75],
  ['Ubase64urlpad', 55],
];

const multibaseToUint = (multibaseName: string): number => {
  return constants.filter((e) => e[0] == multibaseName)[0][1];
};

const uintToMultibase = (number: number): string => {
  return constants.filter((e) => e[1] == number)[0][0];
};

export const cidToHex32 = (cidStr) => {
  /** store the encoded cids as they are, including the multibase bytes */
  const cid = new CID(cidStr);
  const bytes = cid.bytes;

  /* push the code of the multibse (UTF8 number of the string) */
  const bytesWithMultibase = new Uint8Array(bytes.length + 1);
  bytesWithMultibase.set(Uint8Array.from([multibaseToUint(cid.multibaseName)]));
  bytesWithMultibase.set(bytes, 1);

  /** convert to hex */
  let cidEncoded16 = Buffer.from(bytesWithMultibase).toString('hex');
  /** pad with zeros */
  cidEncoded16 = cidEncoded16.padStart(128, '0');

  const cidHex0 = cidEncoded16.slice(-64); /** LSB */
  const cidHex1 = cidEncoded16.slice(-128, -64);

  return ['0x' + cidHex1, '0x' + cidHex0];
};

export const bytes32ToCid = (bytes: [string, string]) => {
  const cidHex1 = bytes[0].substring(2);
  const cidHex0 = bytes[1].substring(2); /** LSB */

  const cidHex = cidHex1.concat(cidHex0).replace(/^0+/, '');
  if (cidHex === '') return '';

  const cidBufferWithBase = Buffer.from(cidHex, 'hex');

  const multibaseCode = cidBufferWithBase[0];
  const cidBuffer = cidBufferWithBase.slice(1);

  const multibaseName = uintToMultibase(multibaseCode);

  /** Force Buffer class */
  const cid = new CID(cidBuffer);

  return cid.toBaseEncodedString(multibaseName as any);
};

const LOGINFO = false;

export async function deriveEntity<O extends object>(
  object: O,
  config: CidConfig = defaultCidConfig,
  casID: string
): Promise<Entity<O>> {
  const hash = await hashObject(object, config);

  const entity = {
    id: hash,
    object,
    casID,
  };

  if (LOGINFO) console.log('deriveEntity', { entity, config });

  return entity;
}

/** verify that the reference entities that have a hash were created with the same hash */
export function validateEntities(entities: Entity[], references: EntityCreate[]) {
  references.map((ref) => {
    if (ref.id) {
      const entity = entities.find((e) => e.id === ref.id);
      if (!entity) {
        /** append stringified object */
        entities.forEach((entity) => ((entity as any).objectStr = JSON.stringify(entity.object)));
        references.forEach((entity) => ((entity as any).objectStr = JSON.stringify(entity.object)));

        console.error(`Entity ${ref.id} not correctly created`, { entities, references });
        throw new Error(`Entity ${JSON.stringify(ref)} not found in entity set`);
      }
    }
  });
}
