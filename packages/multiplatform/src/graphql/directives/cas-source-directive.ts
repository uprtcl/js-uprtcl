import { interfaces } from 'inversify';

import { CASSource } from '../../types/cas-source';
import { LoadEntityDirective } from './load-entity-directive';

export class CASSourceDirective extends LoadEntityDirective {
  protected getCASSource(container: interfaces.Container): CASSource {
    return container.get(this.args.source);
  }

  static get directive() {
    return 'source';
  }
}
