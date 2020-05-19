import { interfaces } from 'inversify';

import { Entity } from '@uprtcl/cortex';

import { CASSource } from '../../types/cas-source';
import { LoadEntityDirective } from './load-entity-directive';

export class CASSourceDirective extends LoadEntityDirective {
  protected async resolveEntity(
    container: interfaces.Container,
    reference: string
  ): Promise<Entity<any> | undefined> {
    const source: CASSource = container.get(this.args.source);

    const object = await source.get(reference);
    if (!object) return undefined;
    return {
      id: reference,
      object,
      casID: source.casID,
    };
  }

  static get directive() {
    return 'source';
  }
}
