import { GraphQLField } from 'graphql';
import { interfaces } from 'inversify';

import { NamedDirective } from '@uprtcl/graphql';

import { CASSource } from '../../types/cas-source';
import { DiscoveryBindings } from '../../bindings';
import { EntityCache } from '../entity-cache';
import { KnownSourcesService } from 'src/known-sources/known-sources.service';
import { Entity, PatternRecognizer, CortexModule } from '@uprtcl/cortex';

export abstract class LoadEntityDirective extends NamedDirective {
  protected abstract getCASSource(container: interfaces.Container): CASSource;

  public visitFieldDefinition(field: GraphQLField<any, any>, detail) {
    let defaultResolver = field.resolve;

    field.resolve = async (parent, args, context, info) => {
      let entityId: string | string[] | undefined = field.name === 'entity' && args.ref;

      if (!entityId) {
        if (!defaultResolver) {
          defaultResolver = parent => parent[field.name];
        }

        entityId = await defaultResolver(parent, args, context, info);
      }

      if (!entityId) return null;

      const source = this.getCASSource(context.container);
      const entityCache: EntityCache = context.container.get(DiscoveryBindings.EntityCache);
      const recognizer: PatternRecognizer = context.container.get(CortexModule.bindings.Recognizer);
      const localKnownSources: KnownSourcesService = context.container.get(
        DiscoveryBindings.LocalKnownSources
      );

      if (typeof entityId === 'string')
        return this.loadEntity(entityId, recognizer, entityCache, localKnownSources, source);
      else if (Array.isArray(entityId)) {
        return entityId.map(id =>
          this.loadEntity(id, recognizer, entityCache, localKnownSources, source)
        );
      }
    };
  }

  protected async loadEntity(
    entityId: string,
    recognizer: PatternRecognizer,
    entityCache: EntityCache,
    localKnownSources: KnownSourcesService,
    source: CASSource
  ): Promise<any | undefined> {
    const cachedEntity = entityCache.getCachedEntity(entityId);

    if (cachedEntity) return { id: cachedEntity.id, ...cachedEntity.entity };

    if (entityCache.pendingLoads[entityId]) return entityCache.pendingLoads[entityId];

    const promise = async () => {
      const loadedEntity: any | undefined = await source.get(entityId);

      if (!loadedEntity) throw new Error(`Could not find entity with id ${entityId}`);

      const entity: Entity<any> = { id: entityId, entity: loadedEntity, casID: source.casID };
      const type = recognizer.recognizeType(entity);

      await localKnownSources.addKnownSources(entityId, [source.casID], type);

      entityCache.cacheEntity(entity);

      entityCache.pendingLoads[entityId] = undefined;

      return { id: entityId, ...entity };
    };

    entityCache.pendingLoads[entityId] = promise();
    return entityCache.pendingLoads[entityId];
  }
}
