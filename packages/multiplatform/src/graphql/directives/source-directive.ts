import { interfaces } from 'inversify';

import { Source } from '../../types/source';
import { LoadEntityDirective } from './load-entity-directive';

export class SourceDirective extends LoadEntityDirective {
  protected getSource(container: interfaces.Container): Source {
    return container.get(this.args.source);
  }

  static get directive() {
    return 'source';
  }
}
