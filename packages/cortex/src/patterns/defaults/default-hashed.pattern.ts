import { HashedPattern, Hashed } from '../patterns/hashed.pattern';
import { TransformPattern } from '../patterns/transform.pattern';
import { injectable } from 'inversify';
import { Pattern } from '../pattern';

export function recognizeHashed(object: object) {
  return (
    object.hasOwnProperty('id') &&
    typeof object['id'] === 'string' &&
    object.hasOwnProperty('object')
  );
}

@injectable()
export class DefaultHashedPattern
  implements Pattern, HashedPattern<any>, TransformPattern<Hashed<any>, [any]> {
  recognize(object: object) {
    return recognizeHashed(object);
  }

  validate<T extends object>(object: Hashed<T>): boolean {
    return true;
  }

  derive<T>(object: T): Hashed<T> {
    return {
      id: 'getHash()',
      object: object
    };
  }

  extract<T>(hashed: Hashed<T>): T {
    return hashed.object;
  }

  getCidConfig(hash: string): any {
    return null; // TODO fix this
  }

  transform(hashed: Hashed<any>): [any] {
    return [hashed.object];
  }
}
