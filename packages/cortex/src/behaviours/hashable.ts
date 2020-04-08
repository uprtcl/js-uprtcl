import { Derivable } from './derivable';
import { IsValid } from './is-valid';


export interface Hashable<T extends object> extends Derivable<Hashed<T>>, IsValid {}
