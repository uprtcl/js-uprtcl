import { HashedPattern, Hashed } from '../patterns/hashed.pattern';

export class DefaultHashedPattern implements HashedPattern<any> {
  recognize(object: object) {
    return (
      object.hasOwnProperty('id') &&
      typeof object['id'] === 'string' &&
      object.hasOwnProperty('object')
    );
  }

  validate<T extends object>(object: Hashed<T>): boolean {
    return true;
  }

  derive<T extends object>(object: T): Hashed<T> {
    return {
      id: 'getHash()',
      object: object
    };
  }

  extract<T extends object>(hashed: Hashed<T>): T {
    return hashed.object;
  }

  getCidConfig(hash: string): any {
    return null; // TODO fix this
  }
}
