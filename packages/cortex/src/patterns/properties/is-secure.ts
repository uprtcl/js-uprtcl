import { Derivable } from './derivable';
import { IsValid } from './is-valid';

export interface IsSecure<T> extends Derivable<T>, IsValid {}
