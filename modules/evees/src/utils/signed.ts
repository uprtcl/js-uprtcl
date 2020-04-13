import { Signed, Entity } from '@uprtcl/cortex';

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

  const entity = (object as Entity<any>).object;
  if (!(entity.hasOwnProperty('proof') && entity.hasOwnProperty('payload'))) return undefined;

  return entity.payload;
}
