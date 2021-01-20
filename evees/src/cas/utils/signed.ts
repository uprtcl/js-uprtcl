import { CidConfig, defaultCidConfig } from '../interfaces/cid-config';
import { Signed } from '../../patterns/interfaces/signable';

import { Entity } from '../interfaces/entity';

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

export async function deriveSecured<O>(
  object: O,
  config: CidConfig = defaultCidConfig
): Promise<Secured<O>> {
  const signed = signObject(object);
  return deriveEntity(signed, config);
}
