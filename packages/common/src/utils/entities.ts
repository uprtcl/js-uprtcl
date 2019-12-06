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
  const hasRedirects: HasRedirect<any>[] = patternRecognizer.recognizeProperties(
    entity,
    prop => !!(prop as HasRedirect<any>).redirect
  );

  let isomorphisms: any[] = [];

  for (const hasRedirect of hasRedirects) {
    const redirectHash = await hasRedirect.redirect(entity);

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

  return isomorphisms;
}
