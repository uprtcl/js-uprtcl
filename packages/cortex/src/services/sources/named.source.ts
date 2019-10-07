import { Source } from './source';

export interface NamedSource extends Source {
  /**
   * The source name for this service
   * This should uniquely identify the content addressable space for the object from this service
   */
  name: string;
}
