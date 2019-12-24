import { ApolloClient, gql } from 'apollo-boost';

import { PatternRecognizer, HasRedirect, Hashed } from '@uprtcl/cortex';

export async function loadEntity(client: ApolloClient<any>, hash: string): Promise<any> {
  const result = await client.query({
    query: gql`
    {
      getEntity(id: "${hash}") {
        id
        raw
      }
    }
    `
  });

  return result.data.getEntity.raw;
}

export async function getIsomorphisms(
  patternRecognizer: PatternRecognizer,
  entity: Hashed<any>,
  loadEntity: (id: string) => Promise<Hashed<any>>
): Promise<string[]> {
  let isomorphisms: string[] = [entity.id];

  // Recursive call to get all isomorphisms from redirected entities
  const redirectedIsomorphisms = await redirectEntity(patternRecognizer, entity, loadEntity);
  isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
  return isomorphisms;
}

async function redirectEntity(
  patternRecognizer: PatternRecognizer,
  entity: object,
  loadEntity: (id: string) => Promise<Hashed<any>>
): Promise<string[]> {
  const hasRedirects: HasRedirect<any>[] = patternRecognizer.recognizeProperties(
    entity,
    prop => !!(prop as HasRedirect<any>).redirect
  );

  let isomorphisms: string[] = [];

  for (const hasRedirect of hasRedirects) {
    const redirectHash = await hasRedirect.redirect(entity);

    if (redirectHash) {
      const redirectEntity = await loadEntity(redirectHash);

      if (redirectEntity) {
        const redirectedIsomorphisms = await getIsomorphisms(
          patternRecognizer,
          redirectEntity,
          loadEntity
        );

        isomorphisms = isomorphisms.concat(redirectedIsomorphisms);
      }
    }
  }

  return isomorphisms;
}
