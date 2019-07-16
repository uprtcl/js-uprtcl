import { Dictionary } from 'lodash';

export interface Properties extends Dictionary<any> {}

export interface Pattern<O extends object = object, P extends Properties = Properties>
  extends Dictionary<any> {
  recognize: (object: object) => boolean;

  properties: (object: O, properties: Properties) => P;
}
