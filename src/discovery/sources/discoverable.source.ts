import { KnownSourcesService } from '../known-sources/known-sources.service';
import { Source } from './source';

export interface DiscoverableSource<T extends Source = Source> {
  source: T;
  knownSources: KnownSourcesService;
}
