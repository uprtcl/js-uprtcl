import { Source, Ready } from './source';

export interface NamedRemote extends Ready {
  /**
   * The source name for this service
   * This should uniquely identify the content addressable space for the object from this service
   */
  name: string;
}

export type NamedSource = NamedRemote & Source;
