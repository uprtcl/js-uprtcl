import { Source } from './source';
import { KnownSourcesService } from '../known-sources/known-sources.service';

export interface Provider<T extends Source = Source> {
  source: T;
  knownSources: KnownSourcesService;
}
