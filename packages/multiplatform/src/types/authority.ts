import { Ready } from './ready';

export interface Authority extends Ready {
  /**
   * The provider locator for this service
   * This should uniquely identify the provider from which to do requests
   */
  authorityID: string;

  userId?: string | undefined;
}
