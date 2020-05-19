import { Signed, Entity } from '@uprtcl/cortex';
import { CidConfig, defaultCidConfig, CASSource } from '@uprtcl/multiplatform';
import { deriveEntity, Secured } from './cid-hash';

export function signObject<T>(object: T): Signed<T> {
  return {
    proof: {
      signature: '',
      type: '',
    },
    payload: object,
  };
}

export function extractSignedEntity(object: object): any | undefined {
  if (!(object.hasOwnProperty('id') && object.hasOwnProperty('object'))) return undefined;

  const entity = (object as Entity<any>).object;
  if (!(entity.hasOwnProperty('proof') && entity.hasOwnProperty('payload'))) return undefined;

  return entity.payload;
}

export async function deriveSecured<O>(
  object: O,
  config: CidConfig = defaultCidConfig
): Promise<Secured<O>> {
  const signed = signObject(object);
  return deriveEntity(signed, config);
}
