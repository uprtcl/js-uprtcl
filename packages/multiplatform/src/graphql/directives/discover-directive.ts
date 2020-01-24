import { interfaces } from 'inversify';

import { MultiplatformBindings } from '../../bindings';
import { Source } from '../../types/source';
import { LoadEntityDirective } from './load-entity-directive';

export class DiscoverDirective extends LoadEntityDirective {
  protected getSource(container: interfaces.Container): Source {
    return container.get(MultiplatformBindings.DiscoveryService);
  }

  static get directive() {
    return 'discover';
  }
}
