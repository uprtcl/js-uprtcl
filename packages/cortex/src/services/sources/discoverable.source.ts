import { KnownSourcesService } from '../known-sources/known-sources.service';
import { ServiceProvider } from './service.provider';
import { SourceProvider } from './source';

/**
 * A service that has a known source service associated, so that any object stored on it
 * can be linked to/from other sources
 */
export interface DiscoverableService<T extends ServiceProvider = ServiceProvider> {
  service: T;
  knownSources?: KnownSourcesService;
}

export type DiscoverableSource<T extends SourceProvider> = DiscoverableService<T>;
