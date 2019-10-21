import { KnownSourcesService } from '../known-sources/known-sources.service';
import { NamedSource } from './named.source';

export interface DiscoverableSource<T extends NamedSource = NamedSource> {
  source: T;
  knownSources: KnownSourcesService;
}
