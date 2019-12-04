import { ApolloLink, NextLink, Operation, Observable, FetchResult } from 'apollo-link';

import {
  discoverLinksKnownSources,
  PatternTypes,
  PatternRecognizer,
  getUplToDiscover,
  KnownSourcesService,
  DiscoveryTypes,
  Source,
  SourceProvider,
  ServiceProvider
} from '@uprtcl/cortex';
import { SelectionNode, DefinitionNode, OperationDefinitionNode } from 'graphql';
import { interfaces } from 'inversify';
import { ApolloCache } from 'apollo-cache';
import { NormalizedCacheObject, gql } from 'apollo-boost';
import { GET_SOURCE } from './base-schema';

export class DiscoveryLink extends ApolloLink {

  request(operation: Operation, forward: NextLink) {
    const context = operation.getContext();
    const container = context.container;
    const cache: ApolloCache<NormalizedCacheObject> = context.cache;

    console.log(context);

    const operationObserver = forward(operation);

    return new Observable<FetchResult>(observer => {
      operationObserver.subscribe({
        next: async result => {
          if (!result.data || !result.data.getEntity) return result;

          const hash = result.data.getEntity.id;
          const object = result.data.getEntity.raw;

          const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);
          const localKnownSources: KnownSourcesService = container.get(
            DiscoveryTypes.LocalKnownSources
          );

          const source = cache.readQuery({
            query: gql`{ sources @client }`
          });
          console.log(source);

          /* 
          await localKnownSources.addKnownSources(hash, [source]);
          const serviceProvider: ServiceProvider = container.get(source);

          await discoverLinksKnownSources(recognizer, localKnownSources)(object, serviceProvider);

 */ observer.next(
            result
          );
        },
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer)
      });
    });
  }
}
