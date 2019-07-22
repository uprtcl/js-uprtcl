import { DerivePattern } from './derive.pattern';
import { ValidatePattern } from './validate.pattern';

export interface SecuredPattern<T> extends DerivePattern<T>, ValidatePattern<T> {
  getObject<O>(object: T): O;
}
