import { ApolloLink, NextLink, Operation, Observable, FetchResult } from 'apollo-link';
import { ApolloCache } from 'apollo-cache';
import { NormalizedCacheObject, gql } from 'apollo-boost';

import { PatternRecognizer, CortexModule } from '@uprtcl/cortex';
import { KnownSourcesService, DiscoveryModule } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';

export class DiscoveryLink extends ApolloLink {

  logger = new Logger('DISCOVERY-LINK');

  request(operation: Operation, forward: NextLink) {
    const context = operation.getContext();
    const container = context.container;
    const cache: ApolloCache<NormalizedCacheObject> = context.cache;

    this.logger.info({ operation, cache });
    
    const operationObserver = forward(operation);

    return new Observable<FetchResult>(observer => {
      operationObserver.subscribe({
        next: async result => {
          if (!result.data || !result.data.entity) {
            observer.next(result);
            return;
          }

          const hash = result.data.entity.id;
          const object = result.data.entity;

          const recognizer: PatternRecognizer = container.get(CortexModule.types.Recognizer);
          const localKnownSources: KnownSourcesService = container.get(
            DiscoveryModule.types.LocalKnownSources
          );

          /* 
          await localKnownSources.addKnownSources(hash, [source]);
          const serviceProvider: ServiceProvider = container.get(source);

          await discoverLinksKnownSources(recognizer, localKnownSources)(object, serviceProvider);
           */

          observer.next(result);
        },
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer)
      });
    });
  }
}
