import { KnownSourcesService } from '../known-sources/known-sources.service';
import { NamedRemote, NamedSource } from './named.source';

/**
 * A service that has a known source service associated, so that any object stored on it
 * can be linked to/from other sources
 */
export interface DiscoverableService<T extends NamedRemote = NamedRemote> {
  service: T;
  knownSources?: KnownSourcesService;
}

export type DiscoverableSource<T extends NamedSource> = DiscoverableService<T>;
