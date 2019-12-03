import { ApolloLink, NextLink, Operation, Observable, FetchResult } from 'apollo-link';
import { Container } from 'inversify';

import { PatternTypes, PatternRecognizer, HasLinks, Pattern } from '@uprtcl/cortex';

export class DiscoveryLink extends ApolloLink {

  async getObjectLinks(rawObject: object, container: Container): Promise<string[]> {
    const recognizer: PatternRecognizer = container.get(PatternTypes.Recognizer);

    const patterns: Array<Pattern | HasLinks> = recognizer.recognize(rawObject);

    const linksPatterns: HasLinks[] = patterns.filter(
      pattern => !!(pattern as HasLinks).getLinks
    ) as HasLinks[];

    const linksPromises = linksPatterns.map((hasLinks: HasLinks) => hasLinks.getLinks(rawObject));

    const links = await Promise.all(linksPromises);

    return links.reduce((acc, next) => acc.concat(next), []);
  }

  request(operation: Operation, forward: NextLink) {
    const operationObserver = forward(operation);

    return new Observable<FetchResult>(observer => {
      operationObserver.subscribe({
        next: async result => {
          if (!result.data || !result.data.getEntity) return result;

          const object = result.data.getEntity.raw;
          const { container } = operation.getContext();
          const links = await this.getObjectLinks(object, container);

          // Do stuff with links

          observer.next(result);
        },
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer)
      });
    });
  }
}
