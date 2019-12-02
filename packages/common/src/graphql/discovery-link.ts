import { ApolloLink, NextLink, Operation, Observable, FetchResult } from 'apollo-link';
import { SelectionNode, DefinitionNode, OperationDefinitionNode } from 'graphql';
import { PatternTypes, PatternRecognizer, HasLinks, Pattern } from '@uprtcl/cortex';
import { Container } from 'inversify';

export class DiscoveryLink extends ApolloLink {
  getHashFromSelection(selection: SelectionNode): string | undefined {
    if (
      !(
        selection.kind === 'Field' &&
        selection.name.kind === 'Name' &&
        selection.name.value === 'getEntity' &&
        selection.arguments
      )
    )
      return undefined;

    const argId = selection.arguments.find(arg => arg.name.value === 'id');
    return argId && argId.value.kind === 'StringValue' ? argId.value.value : undefined;
  }

  isDefinitionQuery(def: DefinitionNode): boolean {
    return def.kind === 'OperationDefinition' && def.operation === 'query';
  }

  getEntityHashes(operation: Operation): string[] {
    const queryDefs: OperationDefinitionNode[] = operation.query.definitions.filter(
      this.isDefinitionQuery
    ) as OperationDefinitionNode[];
    const selections: SelectionNode[] = queryDefs.reduce(
      (acc, def: OperationDefinitionNode) => acc.concat(def.selectionSet.selections),
      [] as any[]
    );
    const maybeHashed = selections.map(this.getHashFromSelection);

    return maybeHashed.filter(hash => !!hash) as string[];
  }

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
    const hashes = this.getEntityHashes(operation);

    const operationObserver = forward(operation);

    if (hashes.length === 0) return operationObserver;

    return new Observable<FetchResult>(observer => {
      operationObserver.subscribe({
        next: async result => {
          if (!result.data) return result;

          const object = result.data.getEntity.raw;
          const { container } = operation.getContext();
          const links = await this.getObjectLinks(object, container);

          // Do stuff with links

          observer.next(result);
        },
        complete: observer.complete.bind(observer)
      });
    });
  }
}
