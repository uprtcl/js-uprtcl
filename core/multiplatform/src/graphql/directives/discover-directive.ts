import { interfaces } from 'inversify';

import { LoadEntityDirective } from './load-entity-directive';
import { Entity, CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { ResolveEntity } from '../../behaviours/resolve-entity';

export class DiscoverDirective extends LoadEntityDirective {
  protected async resolveEntity(
    container: interfaces.Container,
    reference: string
  ): Promise<Entity<any> | undefined> {
    const recognizer: PatternRecognizer = container.get(CortexModule.bindings.Recognizer);

    const resolveBehaviours: ResolveEntity[] = recognizer.recognizeBehaviours(reference);

    if (resolveBehaviours.length === 0)
      throw new Error(
        `No reference pattern recognized the reference ${reference} when trying to resolve it to an entity`
      );
    if (resolveBehaviours.length > 1)
      throw new Error(
        `Ambiguous error when trying to resolve entity with reference ${reference}, reference patterns: ${resolveBehaviours}`
      );

    return resolveBehaviours[0].resolve(reference);
  }

  static get directive() {
    return 'discover';
  }
}
