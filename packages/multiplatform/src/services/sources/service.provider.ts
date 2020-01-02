import { KnownSourcesService } from '../known-sources/known-sources.service';

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

  /**
   * If the service provider has a known source service associated, any object stored on it
   * can be linked to/from other sources
   */
  knownSources?: KnownSourcesService;

  userId?: string | undefined;
}
