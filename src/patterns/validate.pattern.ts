import { Properties } from './pattern';

export interface ValidateProperties extends Properties {
  validate: () => boolean;
}
