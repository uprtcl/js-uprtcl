import { interfaces } from 'inversify';

import { MultiplatformBindings } from '../../bindings';
import { CASSource } from '../../types/cas-source';
import { LoadEntityDirective } from './load-entity-directive';

export class DiscoverDirective extends LoadEntityDirective {
  protected getCASSource(container: interfaces.Container): CASSource {
    return container.get(MultiplatformBindings.DiscoveryService);
  }

  static get directive() {
    return 'discover';
  }
}
