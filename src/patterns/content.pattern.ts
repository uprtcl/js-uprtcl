import { Properties } from './pattern';

export interface ContentProperties extends Properties {
  getContent: () => Promise<any>;
}
