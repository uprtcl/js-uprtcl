import { UplAuth } from '../../types';

export interface Ready {
  /**
   * Waits until the connection is ready to process calls
   */
  ready(): Promise<void>;
}

export interface ServiceProvider extends Ready {
  /**
   * The provider locator for this service
   * This should uniquely identify the provider from with to do requests
   */
  uprtclProviderLocator: string;

  authInfo?: UplAuth;
}
