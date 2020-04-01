import { CidConfig } from '@uprtcl/multiplatform';
import { Signed, Entity } from '@uprtcl/cortex';

import { hashObject } from './cid-hash';

export function signObject<T>(object: T): Signed<T> {
  return {
    proof: {
      signature: '',
      type: ''
    },
    payload: object
  };
}

export function extractSignedEntity(object: object): any | undefined {
  if (!(object.hasOwnProperty('id') && object.hasOwnProperty('entity'))) return undefined;

  const entity = (object as Entity<any>).entity;
  if (!(entity.hasOwnProperty('proof') && entity.hasOwnProperty('payload'))) return undefined;

  return entity.payload;
}

export async function signAndHashObject(
  object: object,
  cidConfig?: CidConfig
): Promise<[string, Signed<any>]> {
  const signed = signObject(object);
  const hash = await hashObject(signed, cidConfig);

  return [hash, signed];
}
