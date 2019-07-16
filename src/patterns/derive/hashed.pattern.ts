import { Properties } from '../pattern';
import { DerivePattern } from './derive.pattern';
import { ValidateProperties } from '../validate.pattern';
import { CidConfig } from '../../utils/cid.config';

export interface HashedProperties extends ValidateProperties {}

export interface Hashed<T = any> {
  // Hash
  id: string;
  object: T;
}

export const hashedPattern: DerivePattern<Hashed, HashedProperties> = {
  recognize: (object: object) =>
    object.hasOwnProperty('id') && typeof object['id'] === 'string' && object['id'].length > 200,

  properties(object: Hashed, properties: Properties): HashedProperties {
    return {
      validate: () => true
    };
  },

  derive<T>(object: T): Hashed<T> {
    return {
      id: '',
      object: object
    };
  },

  getCidConfig(hash: string): CidConfig {
    return CidConfig.fromCid(hash);
  }
};
