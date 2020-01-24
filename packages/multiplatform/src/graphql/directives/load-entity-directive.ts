import { GraphQLField } from 'graphql';
import { interfaces } from 'inversify';

import { Hashed } from '@uprtcl/cortex';
import { NamedDirective } from '@uprtcl/graphql';

import { Source } from '../../types/source';

export abstract class LoadEntityDirective extends NamedDirective {
  protected abstract getSource(container: interfaces.Container): Source;

  public visitFieldDefinition(field: GraphQLField<any, any>, detail) {
    let defaultResolver = field.resolve;

    field.resolve = async (parent, args, context, info) => {
      let entityId: string | string[] | undefined = args.id;

      if (!entityId) {
        if (!defaultResolver) {
          defaultResolver = parent => parent[field.name];
        }

        entityId = await defaultResolver(parent, args, context, info);
      }

      if (!entityId) return null;

      const source = this.getSource(context.container);

      if (typeof entityId === 'string') return this.loadEntity(entityId, source);
      else return entityId.map(id => this.loadEntity(id, source));
    };
  }

  protected async loadEntity(entityId: string, source: Source): Promise<Hashed<any> | undefined> {
    const entity: Hashed<any> | undefined = await source.get(entityId);

    if (!entity) throw new Error(`Could not find entity with id ${entityId}`);

    return { id: entityId, ...entity.object };
  }
}
