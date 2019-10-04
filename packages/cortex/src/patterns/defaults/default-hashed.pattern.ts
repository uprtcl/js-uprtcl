import { HashedPattern, Hashed } from '../patterns/hashed.pattern';
import { TransformPattern } from '../patterns/transform.pattern';
import { injectable } from 'inversify';
import { forPattern } from '../pattern';

export function recognizeHashed(object: object) {
  return (
    object.hasOwnProperty('id') &&
    typeof object['id'] === 'string' &&
    object.hasOwnProperty('object')
  );
}

@injectable()
export class ValidateHash extends forPattern(recognizeHashed) implements HashedPattern<any> {
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

@injectable()
export class TransformHash extends forPattern(recognizeHashed)
  implements TransformPattern<Hashed<any>, [any]> {
  transform(hashed: Hashed<any>): [any] {
    return [hashed.object];
  }
}
