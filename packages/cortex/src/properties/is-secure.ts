import { Derivable } from './derivable';
import { IsValid } from './is-valid';

export interface IsSecure<T = any> extends Derivable<T>, IsValid<T> {}
