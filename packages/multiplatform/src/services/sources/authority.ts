import { Ready } from './ready';

export interface Authority extends Ready {
  /**
   * The provider locator for this service
   * This should uniquely identify the provider from with to do requests
   */
  authority: string;

  userId?: string | undefined;
}
