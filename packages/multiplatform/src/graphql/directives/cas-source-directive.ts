import { interfaces } from 'inversify';

import { CASSource } from '../../types/cas-source';
import { LoadEntityDirective } from './load-entity-directive';
import { Entity } from '@uprtcl/cortex';

export class CASSourceDirective extends LoadEntityDirective {
  protected async resolveEntity(
    container: interfaces.Container,
    reference: string
  ): Promise<Entity<any> | undefined> {
    const source: CASSource = container.get(this.args.source);

    const entity = await source.get(reference);
    if (!entity) return undefined;
    return {
      id: reference,
      entity,
      casID: source.casID
    };
  }

  static get directive() {
    return 'source';
  }
}
