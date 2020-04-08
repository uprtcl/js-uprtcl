import { KnownSourcesService } from './known-sources.service';
import { CASSource } from '../../types/cas-source';

export interface KnownSourcesSource extends CASSource {
  /**
   * If the service provider has a known source service associated, any object stored on it
   * can be linked to other sources
   */
  knownSources: KnownSourcesService;
}
