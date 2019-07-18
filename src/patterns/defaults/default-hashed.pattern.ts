import { HashedPattern, Hashed } from '../patterns/hashed.pattern';
import { CidConfig } from '../../utils/cid.config';

export class DefaultHashedPattern implements HashedPattern<any> {
  recognize(object: object) {
    return object.hasOwnProperty('id') && typeof object['id'] === 'string';
  }

  validate<T>(object: Hashed<T>): boolean {
    return true;
  }

  derive<T>(object: T): Hashed<T> {
    return {
      id: 'getHash()',
      object: object
    };
  }

  getCidConfig(hash: string): CidConfig {
    return CidConfig.fromCid(hash);
  }
}
