import { ApolloClient, gql } from 'apollo-boost';

import { PatternRecognizer, HasRedirect, Pattern, Transformable } from '@uprtcl/cortex';

export async function loadEntity(client: ApolloClient<any>, hash: string): Promise<any> {
  const result = await client.query({
    query: gql`
    {
      getEntity(id: "${hash}", depth: 1) {
        raw
      }
    }
    `
  });

  return result.data.getEntity.raw;
}

export async function getIsomorphisms(
  patternRecognizer: PatternRecognizer,
  entity: any,
  selectEntity: (id: string) => Promise<any>
): Promise<any[]> {
  let isomorphisms: any[] = [entity];
  console.log('hi', entity);

  // Recursive call to get all isomorphisms from redirected entities
  const redirectedIsomorphisms = await redirectEntity(patternRecognizer, entity, selectEntity);
  isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
  return isomorphisms;
}

async function redirectEntity(
  patternRecognizer: PatternRecognizer,
  entity: object,
  selectEntity: (id: string) => Promise<any>
): Promise<any[]> {
  const patterns: Array<Pattern | HasRedirect> = patternRecognizer.recognize(entity);

  let isomorphisms: any[] = [];

  for (const pattern of patterns) {
    if ((pattern as HasRedirect).redirect) {
      const redirectHash = await (pattern as HasRedirect).redirect(entity);

      if (redirectHash) {
        const redirectEntity = await selectEntity(redirectHash);

        if (redirectEntity) {
          const redirectedIsomorphisms = await getIsomorphisms(
            patternRecognizer,
            redirectEntity,
            selectEntity
          );

          isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
        }
      }
    }
  }

  return isomorphisms;
}
