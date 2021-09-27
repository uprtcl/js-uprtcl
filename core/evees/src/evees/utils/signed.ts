import { CidConfig } from '../interfaces/cid-config';
import { Signed } from '../../patterns/index';

import { deriveEntity } from './cid-hash';
import { Secured } from '../interfaces';

export function signObject<T>(object: T): Signed<T> {
  return {
    proof: {
      signature: '',
      type: '',
    },
    payload: object,
  };
}

export async function deriveSecured<O>(
  object: O,
  config: CidConfig,
  casID: string
): Promise<Secured<O>> {
  const signed = signObject(object);
  return deriveEntity(signed, config, casID);
}
