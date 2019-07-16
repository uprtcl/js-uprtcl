import { Properties, Pattern } from '../pattern';

export interface DerivePattern<O extends object = object, P extends Properties = Properties>
  extends Pattern<O, P> {
  derive<T>(object: T): O;
}
