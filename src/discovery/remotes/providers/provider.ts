import { Source } from '../sources/source';
import { KnownSourcesService } from '../known-sources/known-sources.service';

export interface Provider<T extends Source> {
  source: T;
  knownSources: KnownSourcesService;
}
